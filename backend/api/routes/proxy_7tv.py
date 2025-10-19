from fastapi import APIRouter, HTTPException, Depends
import httpx
from urllib.parse import quote
from api.models import CosmeticsRequest
from auth import get_api_key

router = APIRouter()


@router.get('/7tv/cosmetics')
async def get_7tv_cosmetics(request: CosmeticsRequest = Depends(), api_key: str = Depends(get_api_key)):
    """Proxy to 7tv cosmetics endpoint. Returns {} when 7tv responds 404 so the browser won't log a network 404."""
    user_identifier = request.user_identifier
    url = f"https://7tv.io/v2/cosmetics?user_identifier={quote(user_identifier)}"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            # Upstream request failed (network); surface as 502 so caller knows
            raise HTTPException(status_code=502, detail=str(e))

    # If 7tv returns 200, return the body. If 404, return empty dict to avoid browser 404s.
    if resp.status_code == 200:
        try:
            return resp.json()
        except Exception:
            raise HTTPException(status_code=502, detail='invalid upstream json')
    if resp.status_code == 404:
        return {}
    # For other statuses, convert to 502 to avoid surfacing upstream codes to browser devtools
    raise HTTPException(status_code=502, detail=f'upstream returned {resp.status_code}')
