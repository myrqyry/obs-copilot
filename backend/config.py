import os
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Backwards compatibility shim for legacy environment variable names.
# Some deployments or older dev setups used `admin_api_key` or a comma-separated
# `API_KEYS` list. The new code requires `BACKEND_API_KEY`. If a legacy variable
# is present and `BACKEND_API_KEY` is not, copy the legacy value into the
# expected name so pydantic Settings validation succeeds.
if not os.environ.get('BACKEND_API_KEY'):
    legacy_admin = os.environ.get('admin_api_key') or os.environ.get('ADMIN_API_KEY')
    if legacy_admin:
        os.environ['BACKEND_API_KEY'] = legacy_admin
        # Remove legacy keys to avoid pydantic treating them as 'extra' inputs
        if 'admin_api_key' in os.environ:
            del os.environ['admin_api_key']
        if 'ADMIN_API_KEY' in os.environ:
            del os.environ['ADMIN_API_KEY']
    else:
        api_keys = os.environ.get('API_KEYS')
        if api_keys:
            first = api_keys.split(',')[0].strip()
            if first:
                os.environ['BACKEND_API_KEY'] = first
                # remove legacy API_KEYS to avoid extra input errors
                if 'API_KEYS' in os.environ:
                    del os.environ['API_KEYS']

# Ensure any legacy keys that might still be present in the process environment
# are removed to avoid Pydantic treating them as unexpected "extra" inputs.
for _k in ('admin_api_key', 'ADMIN_API_KEY', 'API_KEYS'):
    if _k in os.environ:
        try:
            del os.environ[_k]
        except Exception:
            pass

from pydantic import field_validator

class Settings(BaseSettings):
    model_config = {
        'extra': 'ignore',
        'env_file': '.env',
        'env_file_encoding': 'utf-8'
    }

    GEMINI_API_KEY: str = Field(
        ...,
        min_length=30,
        pattern=r'^[A-Za-z0-9_-]+$',
        description="Google Gemini API key from Google AI Studio"
    )

    BACKEND_API_KEY: str | None = Field(
        None,
        min_length=16,
        max_length=128,
        description="Backend authentication key for API access"
    )

    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated list of allowed CORS origins"
    )

    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    @field_validator('ALLOWED_ORIGINS')
    @classmethod
    def validate_origins(cls, v: str) -> str:
        origins = [origin.strip() for origin in v.split(',') if origin.strip()]
        for origin in origins:
            if not (origin == '*' or origin.startswith(('http://', 'https://'))):
                raise ValueError(f"Invalid origin format: {origin}")
        return v

    # Redis Caching (optional, with defaults)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None

    # Streamer.bot (optional, with defaults)
    STREAMERBOT_HOST: str = "127.0.0.1"
    STREAMERBOT_PORT: int = 8080

    # Note: model_config above configures env_file and extra handling for
    # pydantic v2 / pydantic-settings. There is no inner Config class to avoid
    # conflicts between v1 and v2 style configuration.

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