# backend/api/routes/assets.py
import os
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends, status
from fastapi.responses import Response
from urllib.parse import urlparse
try:
    from .auth import get_api_key
except Exception:
    from auth import get_api_key

router = APIRouter()

# A dictionary to hold the configurations for various asset APIs
# We pull the API keys securely from the .env file
API_CONFIGS = {
    "giphy": {
        "base_url": "https://api.giphy.com/v1/gifs/search",
        "key_env": "GIPHY_API_KEY",
        "key_param": "api_key",
        "dataPath": "data",
    },
    "tenor": {
        "base_url": "https://tenor.googleapis.com/v2/search",
        "key_env": "TENOR_API_KEY",
        "key_param": "key",
        "dataPath": "results",
    },
    "pixabay": {
        "base_url": "https://pixabay.com/api/",
        "key_env": "PIXABAY_API_KEY",
        "key_param": "key",
        "dataPath": "hits",
    },
    "pexels": {
        "base_url": "https://api.pexels.com/v1/search",
        "key_env": "PEXELS_API_KEY",
        "auth_header": "Authorization",  # Pexels uses an Authorization header
        "dataPath": "photos",
    },
    "unsplash": {
        "base_url": "https://api.unsplash.com/search/photos",
        "key_env": "UNSPLASH_API_KEY",
        "auth_header": "Client-ID",
        "dataPath": "results",
    },
    "tenor_stickers": {
        "base_url": "https://tenor.googleapis.com/v2/search",
        "key_env": "TENOR_API_KEY",
        "key_param": "key",
        "default_params": {"searchfilter": "sticker"},
        "dataPath": "results",
    },
    "wallhaven": {
        "base_url": "https://wallhaven.cc/api/v1/search",
        "key_env": None, # Wallhaven does not require an API key for basic search
        "key_param": None,
        "dataPath": "data",
    },
    "iconfinder": {
        "base_url": "https://api.iconfinder.com/v4/icons/search",
        "key_env": "ICONFINDER_API_KEY",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "dataPath": "icons",
        "default_params": {"count": "10"},
    },
    "iconify": {
        "base_url": "https://api.iconify.design/search",
        "key_env": None,
        "key_param": None,
        "dataPath": "icons",
    },
    "emoji-api": {
        "base_url": "https://emoji-api.com/search",
        "key_env": None,
        "key_param": None,
        "dataPath": "results",
    },
}


@router.get("/search/{api_name}")
async def search_assets(api_name: str, request: Request):
    """
    A generic proxy endpoint to search various third-party asset APIs.
    This version includes more robust key handling and error reporting.
    """
    if api_name not in API_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API '{api_name}' not configured on the backend.",
        )

    config = API_CONFIGS[api_name]
    key_env_variable = config.get("key_env")
    api_key = None

    # Only attempt to load API key if key_env_variable is specified
    if key_env_variable:
        # In development mode without API keys, we can still proceed for APIs that might work without keys
        api_key = os.getenv(key_env_variable)
        # Don't fail if API key is missing in development mode

    # Forward all query parameters from the frontend request
    params = {**config.get("default_params", {}), **dict(request.query_params)}

    # Standardize the main search query parameter from 'query' to 'q' for Giphy/Tenor
    if "query" in params:
        params["q"] = params.pop("query")

    headers = {}
    if api_key: # Only add API key if it exists
        if "auth_header" in config:
            headers[config["auth_header"]] = api_key
        elif "key_param" in config: # Ensure key_param exists before using
            params[config["key_param"]] = api_key

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                config["base_url"], params=params, headers=headers, timeout=10.0
            )
            response.raise_for_status()
            
            data = response.json()
            data_path = config.get("dataPath")
            
            # If a dataPath is defined, try to extract the data from that path
            if data_path:
                return data.get(data_path, [])
            
            return data
        except httpx.HTTPStatusError as e:
            # Forward the exact error from the external API (e.g., Giphy)
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Error from {api_name} API: {e.response.text}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred: {str(e)}",
            )

# Define a list of trusted domains for the image proxy
ALLOWED_IMAGE_DOMAINS = [
    "images.unsplash.com",
    "images.pexels.com",
    "cdn.pixabay.com",
    "i.giphy.com",
    "media.tenor.com",
    "w.wallhaven.cc",
    "th.wallhaven.cc",
    # Add any other trusted domains here
]

@router.get("/proxy-image")
async def proxy_image(image_url: str):
    """
    Proxies an image URL to bypass CORS issues, with SSRF protection.
    """
    try:
        parsed_url = urlparse(image_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid URL provided.")

        if parsed_url.hostname not in ALLOWED_IMAGE_DOMAINS:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image source is not allowed.")

        # Use httpx with follow_redirects=False to prevent redirect-based SSRF
        async with httpx.AsyncClient(follow_redirects=False) as client:
            real_response = await client.get(image_url, timeout=10.0)
            real_response.raise_for_status()

            content_type = real_response.headers.get("Content-Type", "application/octet-stream")
            if not content_type.startswith("image/"):
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL does not point to a valid image.")

            return Response(content=real_response.content, media_type=content_type)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error fetching image from {image_url}: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while proxying image: {str(e)}",
        )
