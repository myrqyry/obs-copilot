# auth.py
import os
import logging
from dotenv import load_dotenv
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

load_dotenv()  # Load environment variables from .env file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get comma-separated API keys from environment
API_KEYS = os.getenv("API_KEYS", "")
VALID_API_KEYS = (
    [key.strip() for key in API_KEYS.split(",") if key.strip()] if API_KEYS else []
)
API_KEY_NAME = "X-API-KEY"

# Security warning for development mode
if not VALID_API_KEYS:
    logger.warning("⚠️ SECURITY WARNING: Server running in INSECURE MODE - No API keys configured!")
    logger.warning("This should only be used for development. Set API_KEYS environment variable for production.")

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)


async def get_api_key(api_key: str = Security(api_key_header)):
    """
    Dependency function to validate the API key.
    Supports multiple comma-separated API keys in environment variable.
    """
    if not VALID_API_KEYS:
        # Allow all if no keys are configured (for development)
        return api_key

    if api_key in VALID_API_KEYS:
        return api_key

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API key",
    )
