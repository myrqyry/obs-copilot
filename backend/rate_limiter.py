from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import hashlib
import os

def get_client_identifier(request: Request) -> str:
    """Get a more secure client identifier for rate limiting."""
    # REASON: The original implementation used an insecure hashing algorithm and a fallback that could be spoofed.
    # This has been updated to use SHA-256 with a salt and a more secure fallback.
    # Try API key first (best identifier)
    api_key = request.headers.get("X-API-KEY")
    if api_key:
        salt = os.urandom(16)
        return f"key:{hashlib.sha256(salt + api_key.encode()).hexdigest()}"

    # Fallback to IP with proper header handling
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded and request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP", "unknown")
    return get_remote_address(request)

limiter = Limiter(key_func=get_client_identifier)
