import secrets
import os
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from config import settings # Import centralized settings

def verify_api_key(provided_key: str) -> bool:
    """
    Verifies the provided API key against the configured key using a timing-attack-safe comparison.
    """
    # Prefer runtime environment override so test fixtures that set env vars
    # via monkeypatch are respected even if Settings was initialized earlier.
    expected_key = os.getenv('BACKEND_API_KEY') or settings.BACKEND_API_KEY

    if not expected_key:
        # If no backend API key is configured, fail closed for security in prod
        # but during development allow unauthenticated access. We check the ENV
        # flag for that.
        if getattr(settings, 'ENV', 'development') == 'development':
            return True
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