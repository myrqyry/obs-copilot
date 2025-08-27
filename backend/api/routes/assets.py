# backend/api/routes/assets.py
import os
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends, status
from backend.auth import get_api_key

router = APIRouter()

# A dictionary to hold the configurations for various asset APIs
# We pull the API keys securely from the .env file
API_CONFIGS = {
    "giphy": {
        "base_url": "https://api.giphy.com/v1/gifs/search",
        "key_env": "GIPHY_API_KEY",
        "key_param": "api_key",
    },
    "tenor": {
        "base_url": "https://tenor.googleapis.com/v2/search",
        "key_env": "TENOR_API_KEY",
        "key_param": "key",
    },
    "pixabay": {
        "base_url": "https://pixabay.com/api/",
        "key_env": "PIXABAY_API_KEY",
        "key_param": "key",
    },
    "pexels": {
        "base_url": "https://api.pexels.com/v1/search",
        "key_env": "PEXELS_API_KEY",
        "auth_header": "Authorization",  # Pexels uses an Authorization header
    },
    "unsplash": {
        "base_url": "https://api.unsplash.com/search/photos",
        "key_env": "UNSPLASH_API_KEY",
        "auth_header": "Client-ID",
    },
    # We can add Wallhaven, Iconfinder, etc. here later!
}


# In baqend/api/routes/assets.py


@router.get("/search/{api_name}", dependencies=[Depends(get_api_key)])
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

    if not key_env_variable:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration for '{api_name}' is missing the 'key_env' setting.",
        )

    api_key = os.getenv(key_env_variable)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"The '{key_env_variable}' API key is not set in the backend's .env file.",
        )

    # Forward all query parameters from the frontend request
    params = dict(request.query_params)

    # Standardize the main search query parameter from 'query' to 'q' for Giphy/Tenor
    if "query" in params:
        params["q"] = params.pop("query")

    headers = {}
    if "auth_header" in config:
        headers[config["auth_header"]] = api_key
    else:
        params[config["key_param"]] = api_key

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                config["base_url"], params=params, headers=headers, timeout=10.0
            )
            response.raise_for_status()
            return response.json()
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
