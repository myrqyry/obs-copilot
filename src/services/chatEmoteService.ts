import axios from 'axios';

type EmoteEntry = {
  code: string;
  src: string;
  provider: 'bttv' | 'ffz' | '7tv' | string;
};

type CacheEntry<T> = { ts: number; value: T };

const TTL = 1000 * 60 * 5; // 5 minutes

const cache = new Map<string, CacheEntry<Map<string, EmoteEntry>>>();

const LOCAL_STORAGE_KEY = 'obs-copilot:emote-cache:v1';
const LOCAL_STORAGE_7TV_KEY = 'obs-copilot:7tv-cosmetics:v1';

function persistCacheToLocalStorage() {
  try {
    const serializable: Array<[string, [number, Array<[string, string, string]>]]> = [];
    for (const [key, entry] of cache.entries()) {
      const arr: Array<[string, string, string]> = [];
      for (const [code, em] of entry.value.entries()) {
        arr.push([code, em.src, em.provider]);
      }
      serializable.push([key, [entry.ts, arr]]);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializable));
  } catch (err) {
    // ignore
  }
}

function restoreCacheFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<[string, [number, Array<[string, string, string]>]]>;
    for (const [key, [ts, arr]] of parsed) {
      const map = new Map<string, EmoteEntry>();
      for (const [code, src, provider] of arr) {
        map.set(code, { code, src, provider: provider as any });
      }
      cache.set(key, { ts, value: map });
    }
  } catch (err) {
    // ignore
  }
}

// On module load try to restore cache
try { restoreCacheFromLocalStorage(); } catch (e) {}

// 7TV cosmetics cache (simple per-username map)
const cosmeticsCache = new Map<string, CacheEntry<{ paintBackground?: string; paintFilter?: string; paintColor?: string }>>();

function persistCosmeticsToLocalStorage() {
  try {
    const arr: Array<[string, number, { paintBackground?: string; paintFilter?: string; paintColor?: string }]> = [];
    for (const [k, v] of cosmeticsCache.entries()) {
      arr.push([k, v.ts, v.value]);
    }
    localStorage.setItem(LOCAL_STORAGE_7TV_KEY, JSON.stringify(arr));
  } catch (e) {}
}

function restoreCosmeticsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_7TV_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<[string, number, { paintBackground?: string; paintFilter?: string; paintColor?: string }]>;
    for (const [k, ts, val] of parsed) {
      cosmeticsCache.set(k, { ts, value: val });
    }
  } catch (e) {}
}

try { restoreCosmeticsFromLocalStorage(); } catch (e) {}

function setCosmeticsCache(key: string, val: { paintBackground?: string; paintFilter?: string; paintColor?: string }) {
  cosmeticsCache.set(key, { ts: Date.now(), value: val });
  try { persistCosmeticsToLocalStorage(); } catch (e) {}
}

function getCosmeticsCache(key: string) {
  const e = cosmeticsCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) {
    cosmeticsCache.delete(key);
    return null;
  }
  return e.value;
}

function setCache(key: string, val: Map<string, EmoteEntry>) {
  cache.set(key, { ts: Date.now(), value: val });
}

function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) {
    cache.delete(key);
    return null;
  }
  return e.value;
}

export async function getCombinedEmotes(channelUserId?: string, channelName?: string) {
  // Return a map code -> EmoteEntry
  const cacheKey = `combined:${channelUserId || channelName || 'global'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const map = new Map<string, EmoteEntry>();

  // Fetch BTTV global (via backend proxy)
  try {
    const res = await axios.get('/api/proxy/emotes/bttv/global', { timeout: 5000 });
    // normalized proxy returns a map: code -> { id, provider, code, src, urls, animated, meta }
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      for (const code of Object.keys(res.data)) {
        const e = (res.data as any)[code];
        const src = e.src || (e.urls && (e.urls['3x'] || e.urls['2x'] || e.urls['1x'])) || null;
        if (code && src) map.set(code, { code, src, provider: 'bttv' });
      }
    } else if (Array.isArray(res.data)) {
      for (const e of res.data) {
        const id = e.id;
        const code = e.code;
        const src = `https://cdn.betterttv.net/emote/${id}/3x`;
        if (code && src) map.set(code, { code, src, provider: 'bttv' });
      }
    }
  } catch (err) {
    // ignore
  }

  // Fetch BTTV channel
  if (channelUserId) {
    try {
      const res = await axios.get(`/api/proxy/emotes/bttv/channel?twitch_id=${encodeURIComponent(channelUserId)}`, { timeout: 5000 });
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        // normalized map
        for (const code of Object.keys(res.data)) {
          const e = (res.data as any)[code];
          const src = e.src || (e.urls && (e.urls['3x'] || e.urls['2x'] || e.urls['1x'])) || null;
          if (code && src) map.set(code, { code, src, provider: 'bttv' });
        }
      } else {
        const emotes = res.data && (res.data.channelEmotes || []).concat(res.data.sharedEmotes || []);
        if (Array.isArray(emotes)) {
          for (const e of emotes) {
            const id = e.id;
            const code = e.code;
            const src = `https://cdn.betterttv.net/emote/${id}/3x`;
            if (code && src) map.set(code, { code, src, provider: 'bttv' });
          }
        }
      }
    } catch (err) {}
  }

  // Fetch FFZ global (via backend proxy)
  try {
    const res = await axios.get('/api/proxy/emotes/ffz/global', { timeout: 5000 });
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && !res.data.sets) {
      // normalized map
      for (const code of Object.keys(res.data)) {
        const e = (res.data as any)[code];
        const src = e.src || (e.urls && (e.urls['4'] || e.urls['2'] || e.urls['1'])) || null;
        if (code && src) map.set(code, { code, src, provider: 'ffz' });
      }
    } else {
      const sets = res.data && res.data.sets;
      if (sets) {
        for (const setId of Object.keys(sets)) {
          const set = sets[setId];
          if (set && Array.isArray(set.emoticons)) {
            for (const em of set.emoticons) {
              const code = em.name || em.code || em.regex || em.name;
              const urls = em.urls || em.urls_map || {};
              const sizes = Object.keys(urls).map(Number).filter((n) => !isNaN(n)).sort((a, b) => b - a);
              const first = sizes.length > 0 ? urls[String(sizes[0])] : null;
              const src = first ? (String(first).startsWith('http') ? String(first) : `https:${first}`) : null;
              if (code && src) map.set(code, { code, src, provider: 'ffz' });
            }
          }
        }
      }
    }
  } catch (err) {}

  // Fetch FFZ channel
  if (channelName) {
    try {
      const res = await axios.get(`/api/proxy/emotes/ffz/channel?channel_name=${encodeURIComponent(channelName)}`, { timeout: 5000 });
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && !res.data.sets) {
        for (const code of Object.keys(res.data)) {
          const e = (res.data as any)[code];
          const src = e.src || (e.urls && (e.urls['4'] || e.urls['2'] || e.urls['1'])) || null;
          if (code && src) map.set(code, { code, src, provider: 'ffz' });
        }
      } else {
        const sets = res.data && res.data.sets;
        if (sets) {
          for (const setId of Object.keys(sets)) {
            const set = sets[setId];
            if (set && Array.isArray(set.emoticons)) {
              for (const em of set.emoticons) {
                const code = em.name || em.code || em.regex || em.name;
                const first = em.urls && Object.values(em.urls)[0];
                const src = first || `https:${em.urls?.['4'] || ''}`;
                if (code && src) map.set(code, { code, src: String(src).startsWith('http') ? String(src) : `https:${src}`, provider: 'ffz' });
              }
            }
          }
        }
      }
    } catch (err) {}
  }

  // Fetch 7TV global (via backend proxy)
  try {
    const res = await axios.get('/api/proxy/emotes/7tv/global', { timeout: 5000 });
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      for (const code of Object.keys(res.data)) {
        const e = (res.data as any)[code];
        const src = e.src || (e.urls && (e.urls['3x'] || e.urls['2x'] || e.urls['1x'])) || null;
        if (code && src) map.set(code, { code, src, provider: '7tv' });
      }
    } else if (Array.isArray(res.data)) {
      for (const e of res.data) {
        const code = e.name;
        let url = null;
        if (Array.isArray(e.urls)) {
          const svg = e.urls.find((u: any) => String(u[1]).endsWith('.svg'));
          if (svg) url = svg[1];
          else url = e.urls[e.urls.length - 1] && e.urls[e.urls.length - 1][1];
        }
        if (code && url) map.set(code, { code, src: url, provider: '7tv' });
      }
    }
  } catch (err) {}

  // Fetch 7TV channel
  if (channelUserId) {
    try {
      const res = await axios.get(`/api/proxy/emotes/7tv/channel?twitch_id=${encodeURIComponent(channelUserId)}`, { timeout: 5000 });
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        for (const code of Object.keys(res.data)) {
          const e = (res.data as any)[code];
          const src = e.src || (e.urls && (e.urls['3x'] || e.urls['2x'] || e.urls['1x'])) || null;
          if (code && src) map.set(code, { code, src, provider: '7tv' });
        }
      } else if (Array.isArray(res.data)) {
        for (const e of res.data) {
          const code = e.name;
          let url = null;
          if (Array.isArray(e.urls)) {
            const svg = e.urls.find((u: any) => String(u[1]).endsWith('.svg'));
            if (svg) url = svg[1];
            else url = e.urls[e.urls.length - 1] && e.urls[e.urls.length - 1][1];
          }
          if (code && url) map.set(code, { code, src: url, provider: '7tv' });
        }
      }
    } catch (err) {}
  }

  setCache(cacheKey, map);
  // persist
  try { persistCacheToLocalStorage(); } catch (e) {}
  return map;
}

// Try to fetch a display color from FFZ user endpoint as a fallback (not guaranteed)
export async function lookupNameColorFFZ(userIdOrName: string) {
  try {
    const res = await axios.get(`https://api.frankerfacez.com/v1/user/${encodeURIComponent(userIdOrName)}`, { timeout: 4000 });
    if (res.data && res.data.user && res.data.user.color) return res.data.user.color;
  } catch (err) {}
  return null;
}

// Fetch 7TV cosmetics for a username (returns an object suitable for inline style usage)
export async function getSevenTVCosmetics(userIdentifier: string) {
  if (!userIdentifier) return null;
  const cached = getCosmeticsCache(userIdentifier);
  if (cached) return cached;
  try {
    // endpoint referenced in upstream component; may vary depending on 7TV deployment
  // Use backend proxy to avoid direct browser requests to 7tv that show 404s in console
  const url = `/api/proxy/7tv/cosmetics?user_identifier=${encodeURIComponent(userIdentifier)}`;
  const res = await axios.get(url, { timeout: 5000 });
    if (res.data) {
      const body = res.data;
      const paint = (body && (body.paint || (Array.isArray(body) && body[0] && body[0].paint))) || null;
      const paintBackground = paint && (paint.background || paint.background_url || paint.backgroundImage || paint.background_image) || null;
      const paintFilter = paint && (paint.filter || paint.css_filter) || null;
      const paintColor = paint && (paint.color || paint.text_color || paint.paintColor) || null;
      const out: { paintBackground?: string; paintFilter?: string; paintColor?: string } = {};
      if (paintBackground) out.paintBackground = typeof paintBackground === 'string' ? paintBackground : String(paintBackground);
      if (paintFilter) out.paintFilter = String(paintFilter);
      if (paintColor) out.paintColor = String(paintColor);
      if (out.paintBackground || out.paintFilter || out.paintColor) {
        setCosmeticsCache(userIdentifier, out);
        return out;
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

export default { getCombinedEmotes, lookupNameColorFFZ, getSevenTVCosmetics };
