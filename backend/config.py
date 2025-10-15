from pydantic_settings import BaseSettings
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    Validates and manages environment variables for the application.
    """
    GEMINI_API_KEY: str
    ADMIN_API_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # API Keys for third-party services
    GIPHY_API_KEY: str | None = None
    TENOR_API_KEY: str | None = None
    ICONFINDER_API_KEY: str | None = None
    UNSPLASH_API_KEY: str | None = None
    PEXELS_API_KEY: str | None = None
    PIXABAY_API_KEY: str | None = None
    DEVIANTART_API_KEY: str | None = None
    IMGFLIP_API_KEY: str | None = None
    IMGUR_API_KEY: str | None = None

    # Comma-separated list of valid API keys
    API_KEYS: str | None = None

    # Redis Caching (optional, with defaults)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None

    # Streamer.bot (optional, with defaults)
    STREAMERBOT_HOST: str = "127.0.0.1"
    STREAMERBOT_PORT: int = 8080

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        # Pydantic will automatically attempt to read the environment variables.
        # If a variable defined in the model is not found, it will raise a ValidationError.

@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached instance of the Settings.
    The lru_cache decorator ensures this function is only run once,
    and subsequent calls return the same Settings object.
    """
    try:
        settings = Settings()
        # Log basic information on startup, but avoid logging sensitive keys.
        logger.info(f"Application running in {settings.ENV} mode.")
        logger.info(f"Allowed origins: {settings.ALLOWED_ORIGINS}")
        return settings
    except Exception as e:
        logger.error(f"FATAL: Configuration error - {e}")
        # This will prevent the application from starting if config is invalid.
        raise SystemExit(f"Configuration error: {e}")

# Initialize settings at startup to ensure validation runs.
settings = get_settings()