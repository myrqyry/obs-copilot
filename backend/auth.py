import secrets
import os
import logging
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from .config import settings # Import centralized settings
from functools import lru_cache
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

# Simple in-memory rate limiting for auth attempts
auth_attempts = defaultdict(list)
MAX_AUTH_ATTEMPTS = 5
AUTH_WINDOW_SECONDS = 300  # 5 minutes

@lru_cache(maxsize=1)
def _get_expected_api_key() -> str | None:
    return os.getenv('BACKEND_API_KEY') or settings.BACKEND_API_KEY

def _check_auth_rate_limit(client_id: str) -> bool:
    """Check if client has exceeded auth attempt rate limit"""
    now = time.time()
    # Clean old attempts
    auth_attempts[client_id] = [t for t in auth_attempts[client_id] if now - t < AUTH_WINDOW_SECONDS]
    
    if len(auth_attempts[client_id]) >= MAX_AUTH_ATTEMPTS:
        return False
    
    auth_attempts[client_id].append(now)
    return True

def verify_api_key(provided_key: str, client_id: str = "unknown") -> bool:
    """
    Verifies the provided API key against the configured key using a timing-attack-safe comparison.
    """
    # Rate limit auth attempts
    if not _check_auth_rate_limit(client_id):
        logger.warning(f"Rate limit exceeded for auth attempts from {client_id}")
        return False
    
    # Cache the expected key to avoid repeated environment lookups
    expected_key = _get_expected_api_key()

    if not expected_key:
        logger.error("No API key configured on server - authentication required")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not properly configured on server."
        )

    # Validate minimum key length
    if len(provided_key) < 32:
        logger.warning(f"API key too short from {client_id}: {len(provided_key)} chars")
        # Still do timing-safe comparison to prevent timing attacks
        secrets.compare_digest("dummy_key_32_chars_long_padding!!", "dummy_key_32_chars_long_padding!!")
        return False

    # Ensure both strings are of equal length before comparison
    if len(provided_key) != len(expected_key):
        # Use a dummy comparison to prevent timing attacks
        secrets.compare_digest("dummy_key_same_length", "dummy_key_same_length")
        return False

    is_valid = secrets.compare_digest(provided_key.encode(), expected_key.encode())
    
    if not is_valid:
        logger.warning(f"Invalid API key attempt from {client_id}")
    
    return is_valid

async def get_api_key(request: Request) -> str:
    """
    Dependency to extract and validate the API key from the request.
    Supports 'X-API-KEY' header and 'api_key' query parameter.
    """
    client_id = request.client.host if request.client else "unknown"
    
    # Always require API key - no development bypass
    expected_key = _get_expected_api_key()
    if not expected_key:
        logger.error("No backend API key configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not properly configured."
        )

    # Try to get the key from the header first
    api_key = request.headers.get("X-API-KEY")

    # If not in header, try the query parameter (less secure, log warning)
    if not api_key:
        api_key = request.query_params.get("api_key")
        if api_key:
            logger.warning(f"API key provided via query parameter from {client_id} - use X-API-KEY header instead")

    # If no key is provided at all, raise an error
    if not api_key:
        logger.warning(f"Missing API key from {client_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "missing_api_key",
                "message": "API key required in 'X-API-KEY' header or 'api_key' query parameter",
                "hint": "Check your VITE_ADMIN_API_KEY configuration"
            }
        )

    # Verify the provided key
    if not verify_api_key(api_key, client_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key."
        )

    return api_key