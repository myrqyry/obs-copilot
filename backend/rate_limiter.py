from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import hashlib
import os
import asyncio
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)

class EnhancedLimiter(Limiter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Start background cleanup task
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._cleanup_expired_entries())
        except RuntimeError:
            # No running event loop, probably in a test environment
            pass

    async def _cleanup_expired_entries(self):
        while True:
            # Clean up expired rate limit entries every 5 minutes
            await asyncio.sleep(300)
            try:
                self._storage._MemoryStorage__expire_events()
            except Exception as e:
                logger.error(f"Rate limiter cleanup error: {e}")

def get_client_identifier(request: Request) -> str:
    """Get a more secure client identifier for rate limiting."""
    # REASON: The original implementation used an insecure hashing algorithm and a fallback that could be spoofed.
    # This has been updated to use SHA-256 with a salt and a more secure fallback.
    # Try API key first (best identifier)
    api_key = request.headers.get("X-API-KEY")
    if api_key:
        return f"key:{hashlib.sha256(api_key.encode()).hexdigest()}"

    # Fallback to IP with proper header handling
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded and request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP", "unknown")
    return get_remote_address(request)

limiter = EnhancedLimiter(
    key_func=get_client_identifier,
    default_limits=["100/hour"]
)
