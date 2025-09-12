from fastapi import APIRouter, HTTPException, Depends
import httpx
from urllib.parse import quote
import time
from typing import Optional
from ..models import EmoteRequest
from ..auth import get_api_key

router = APIRouter()

# Simple in-memory cache: key -> (ts, data)
_CACHE = {}
_TTL = 60 * 5  # 5 minutes

def _cache_get(key):
    v = _CACHE.get(key)
    if not v: return None
    ts, data = v
    if time.time() - ts > _TTL:
        _CACHE.pop(key, None)
        return None
    return data

def _cache_set(key, data):
    _CACHE[key] = (time.time(), data)


def _pick_best_src_from_urls(urls):
    """Accepts various url shapes and returns a single preferred src and a urls map.
    urls can be: dict of size->url, list of [size,url] pairs, or a single string."""
    if not urls:
        return None, {}
    urls_map = {}
    # dict-like
    if isinstance(urls, dict):
        for k, v in urls.items():
            try:
                # normalize keys like '1', '2', '3', '1x', '2x'
                size_key = str(k)
                urls_map[size_key] = v
            except Exception:
                continue
    # list of pairs
    elif isinstance(urls, list):
        for item in urls:
            if not item: continue
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                size_key = str(item[0])
                urls_map[size_key] = item[1]
    # single string
    elif isinstance(urls, str):
        urls_map['default'] = urls

    # choose largest numeric key if possible
    best = None
    best_num = -1
    for k in urls_map.keys():
        # extract digits
        digits = ''.join(ch for ch in k if ch.isdigit())
        try:
            n = int(digits) if digits else 0
        except Exception:
            n = 0
        if n > best_num:
            best_num = n
            best = urls_map[k]

    # fallback to any available url
    if not best:
        for v in urls_map.values():
            best = v
            break

    return best, urls_map


def _normalize_bttv(raw):
    """Normalize BTTV response (global or channel) to map(code -> emote)"""
    out = {}
    try:
        # BTTV responses often have either an array of emotes or an object with 'emotes'
        items = None
        if isinstance(raw, dict) and 'emotes' in raw:
            items = raw.get('emotes')
        elif isinstance(raw, list):
            items = raw
        elif isinstance(raw, dict) and 'url' in raw and 'id' in raw:
            items = [raw]

        if not items:
            return out

        for e in items:
            try:
                emote_id = str(e.get('id') or e.get('emote') or e.get('_id') or '')
                code = e.get('code') or e.get('name') or e.get('emote') or ''
                animated = bool(e.get('animated') or e.get('imageType') == 'animated')
                # some endpoints include urls or imageType; fallback to CDN
                urls = {}
                src = None
                if e.get('url'):
                    src = e.get('url')
                    urls['default'] = src
                else:
                    # try to construct CDN urls
                    if emote_id:
                        for sz_key, sz in [('1x','1'), ('2x','2'), ('3x','3')]:
                            urls[sz_key] = f'https://cdn.betterttv.net/emote/{emote_id}/{sz}'
                        src = urls.get('3x') or urls.get('2x') or urls.get('1x')

                out[str(code)] = {
                    'id': emote_id,
                    'provider': 'bttv',
                    'code': code,
                    'src': src,
                    'urls': urls,
                    'animated': animated,
                    'meta': e,
                }
            except Exception:
                continue
    except Exception:
        return {}
    return out


def _normalize_ffz(raw):
    """Normalize FFZ v1/v2 responses into map(code->emote)"""
    out = {}
    try:
        # FFZ responses commonly have 'sets' where each set contains 'emoticons'
        sets = None
        if isinstance(raw, dict) and 'sets' in raw:
            sets = raw.get('sets')
        elif isinstance(raw, dict) and 'emoticons' in raw:
            # rare shape
            emoticons = raw.get('emoticons') or []
            for e in emoticons:
                name = e.get('name') or e.get('code')
                urls = e.get('urls') or {}
                src, urls_map = _pick_best_src_from_urls(urls)
                out[str(name)] = {
                    'id': str(e.get('id') or ''),
                    'provider': 'ffz',
                    'code': name,
                    'src': src,
                    'urls': urls_map,
                    'animated': bool(e.get('animated') or False),
                    'meta': e,
                }
            return out

        if sets:
            for set_k, set_v in sets.items():
                # set_v may contain 'emoticons' array
                emoticons = set_v.get('emoticons') or set_v.get('emotes') or []
                for e in emoticons:
                    name = e.get('name') or e.get('code')
                    urls = e.get('urls') or {}
                    src, urls_map = _pick_best_src_from_urls(urls)
                    out[str(name)] = {
                        'id': str(e.get('id') or ''),
                        'provider': 'ffz',
                        'code': name,
                        'src': src,
                        'urls': urls_map,
                        'animated': bool(e.get('animated') or False),
                        'meta': e,
                    }
    except Exception:
        return {}
    return out


def _normalize_7tv(raw):
    """Normalize 7TV responses (array of emotes or object) to map(code->emote)"""
    out = {}
    try:
        items = []
        if isinstance(raw, list):
            items = raw
        elif isinstance(raw, dict) and 'emotes' in raw:
            items = raw.get('emotes')
        elif isinstance(raw, dict) and 'data' in raw:
            # some API shapes
            items = raw.get('data') or []

        for e in items:
            try:
                emote_id = str(e.get('id') or '')
                code = e.get('name') or e.get('code') or ''
                animated = bool(e.get('animated') or e.get('host') == 'gif')
                # 7tv often provides `urls` as list of [size, url]
                urls = e.get('urls') or e.get('url') or {}
                src, urls_map = _pick_best_src_from_urls(urls)
                out[str(code)] = {
                    'id': emote_id,
                    'provider': '7tv',
                    'code': code,
                    'src': src,
                    'urls': urls_map,
                    'animated': animated,
                    'meta': e,
                }
            except Exception:
                continue
    except Exception:
        return {}
    return out


@router.get('/bttv/global')
async def bttv_global(api_key: str = Depends(get_api_key)):
    key = 'bttv:global'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = 'https://api.betterttv.net/3/cached/emotes/global'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_bttv(raw)
        _cache_set(key, data)
        return data
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')


@router.get('/bttv/channel')
async def bttv_channel(request: EmoteRequest = Depends(), api_key: str = Depends(get_api_key)):
    twitch_id = request.twitch_id
    if not twitch_id:
        raise HTTPException(status_code=400, detail="twitch_id required for BTTV channel emotes")
    key = f'bttv:channel:{twitch_id}'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = f'https://api.betterttv.net/3/cached/users/twitch/{twitch_id}'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_bttv(raw)
        _cache_set(key, data)
        return data
    if resp.status_code == 404:
        return {}
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')


@router.get('/ffz/global')
async def ffz_global(api_key: str = Depends(get_api_key)):
    key = 'ffz:global'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = 'https://api.frankerfacez.com/v1/set/global'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_ffz(raw)
        _cache_set(key, data)
        return data
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')


@router.get('/ffz/channel')
async def ffz_channel(request: EmoteRequest = Depends(), api_key: str = Depends(get_api_key)):
    channel_name = request.channel_name
    if not channel_name:
        raise HTTPException(status_code=400, detail="channel_name required for FFZ channel emotes")
    key = f'ffz:channel:{channel_name}'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = f'https://api.frankerfacez.com/v1/room/{quote(channel_name)}'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_ffz(raw)
        _cache_set(key, data)
        return data
    if resp.status_code == 404:
        return {}
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')


@router.get('/7tv/global')
async def seven_tv_global(api_key: str = Depends(get_api_key)):
    key = '7tv:global'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = 'https://api.7tv.app/v2/emotes/global'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_7tv(raw)
        _cache_set(key, data)
        return data
    if resp.status_code == 404:
        # upstream has no global emotes or endpoint not found — return empty map to avoid noisy browser errors
        _cache_set(key, {})
        return {}
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')


@router.get('/7tv/channel')
async def seven_tv_channel(request: EmoteRequest = Depends(), api_key: str = Depends(get_api_key)):
    twitch_id = request.twitch_id
    if not twitch_id:
        raise HTTPException(status_code=400, detail="twitch_id required for 7TV channel emotes")
    key = f'7tv:channel:{twitch_id}'
    cached = _cache_get(key)
    if cached is not None:
        return cached
    url = f'https://api.7tv.app/v2/users/{quote(twitch_id)}/emotes'
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=str(e))
    if resp.status_code == 200:
        raw = resp.json()
        data = _normalize_7tv(raw)
        _cache_set(key, data)
        return data
    if resp.status_code == 404:
        # channel not found / no emotes — return empty normalized map
        _cache_set(key, {})
        return {}
    raise HTTPException(status_code=502, detail=f'upstream {resp.status_code}')
