from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_client_identifier(request: Request) -> str:
    """Get a more secure client identifier for rate limiting."""
    # Try API key first (best identifier)
    api_key = request.headers.get("X-API-KEY")
    if api_key:
        return f"key:{hash(api_key) % 10000}"  # Hash for privacy

    # Fallback to IP with proper header handling
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded and request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP", "unknown")
    return get_remote_address(request)

limiter = Limiter(key_func=get_client_identifier)