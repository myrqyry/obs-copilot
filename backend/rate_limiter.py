import hmac
import hashlib
import os
import ipaddress
import logging
from typing import Dict, Optional
from fastapi import Request
from functools import lru_cache
from slowapi import Limiter

logger = logging.getLogger(__name__)

# Generate a server-side secret for rate limiting (store in environment in production)
RATE_LIMIT_SECRET = os.getenv('RATE_LIMIT_SECRET', os.urandom(32).hex())

@lru_cache(maxsize=1000)
def get_client_identifier(request: Request) -> str:
    """Generate a secure client identifier for rate limiting."""
    api_key = request.headers.get("X-API-KEY")
    if api_key:
        # Use HMAC for better security
        identifier = hmac.new(
            RATE_LIMIT_SECRET.encode(),
            api_key.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"key:{identifier}"

    # Enhanced IP detection with validation
    forwarded = request.headers.get("X-Forwarded-For")
    real_ip = request.headers.get("X-Real-IP")

    # Validate and use X-Real-IP if present and valid
    if real_ip:
        try:
            ipaddress.ip_address(real_ip)
            return f"ip:{real_ip}"
        except ValueError:
            logger.warning(f"Invalid X-Real-IP header: {real_ip}")

    # Parse X-Forwarded-For (use first IP)
    if forwarded:
        try:
            first_ip = forwarded.split(',')[0].strip()
            ipaddress.ip_address(first_ip)
            return f"ip:{first_ip}"
        except (ValueError, IndexError):
            logger.warning(f"Invalid X-Forwarded-For header: {forwarded}")

    # Fallback to direct connection
    client_host = request.client.host if request.client else "unknown"
    try:
        ipaddress.ip_address(client_host)
        return f"ip:{client_host}"
    except ValueError:
        return f"host:{client_host}"

# Enhanced rate limiting with different tiers
RATE_LIMITS = {
    '/api/gemini/stream': "20/minute",
    '/api/gemini/generate-image-enhanced': "10/minute",
    '/api/gemini/generate-speech': "30/minute",
    '/api/gemini/obs-aware-query': "15/minute",
    'default': "100/minute"
}

def get_rate_limit_for_endpoint(endpoint: str) -> str:
    """Get rate limit for specific endpoint."""
    return RATE_LIMITS.get(endpoint, RATE_LIMITS['default'])

limiter = Limiter(key_func=get_client_identifier, default_limits=[RATE_LIMITS['default']])
