import secrets
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from config import settings # Import centralized settings

def verify_api_key(provided_key: str) -> bool:
    """
    Verifies the provided API key against the configured key using a timing-attack-safe comparison.
    """
    expected_key = settings.BACKEND_API_KEY
    # The key is already validated by Pydantic settings, so we just check it's not empty
    if not expected_key:
        # This case should ideally not be reached due to Pydantic validation
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key not configured on server."
        )

    return secrets.compare_digest(provided_key.encode(), expected_key.encode())

async def get_api_key(request: Request) -> str:
    """
    Dependency to extract and validate the API key from the request.
    Supports 'X-API-KEY' header and 'api_key' query parameter.
    """
    # Try to get the key from the header first
    api_key = request.headers.get("X-API-KEY")

    # If not in header, try the query parameter
    if not api_key:
        api_key = request.query_params.get("api_key")

    # If no key is provided at all, raise an error
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "missing_api_key",
                "message": "API key required in 'X-API-KEY' header or 'api_key' query parameter",
                "hint": "Check your VITE_ADMIN_API_KEY configuration"
            }
        )

    # Verify the provided key
    if not verify_api_key(api_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key."
        )

    return api_key