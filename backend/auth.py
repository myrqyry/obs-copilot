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

# Get environment, default to 'development'
ENV = os.getenv("ENV", "development")

# Get comma-separated API keys from environment
API_KEYS = os.getenv("API_KEYS", "")
VALID_API_KEYS = (
    [key.strip() for key in API_KEYS.split(",") if key.strip()] if API_KEYS else []
)
# Define a default dev key
DEV_FALLBACK_KEY = "dev-only-secret-key"
API_KEY_NAME = "X-API-KEY"

# Security checks for production
if ENV == "production":
    if not VALID_API_KEYS:
        logger.error("FATAL: Server startup failed - API_KEYS environment variable must be set in production.")
        raise RuntimeError("Server startup failed: API_KEYS environment variable is not set for production.")
    if not os.getenv("GEMINI_API_KEY"):
        logger.error("FATAL: Server startup failed - GEMINI_API_KEY environment variable must be set in production.")
        raise RuntimeError("Server startup failed: GEMINI_API_KEY environment variable is not set for production.")
else:
    # Security warning for development mode
    if not VALID_API_KEYS:
        logger.warning("⚠️ SECURITY WARNING: Server running in INSECURE MODE - No API keys configured!")
        logger.warning("This should only be used for development. Set API_KEYS environment variable for production.")


api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)


async def get_api_key(api_key: str = Security(api_key_header)):
    """
    Dependency function to validate the API key.
    """
    if VALID_API_KEYS:
        if api_key in VALID_API_KEYS:
            return api_key
    elif ENV != "production":
        # In dev mode, if no keys are set, only allow the fallback key
        if api_key == DEV_FALLBACK_KEY:
            return api_key

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API key",
    )