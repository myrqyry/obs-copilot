from dataclasses import dataclass
from typing import List
import re
import logging

logger = logging.getLogger(__name__)

@dataclass
class CorsConfig:
    environment: str
    allowed_patterns: List[str]
    allow_wildcards: bool = False

    @classmethod
    def for_environment(cls, env: str) -> 'CorsConfig':
        configs = {
            'development': cls(
                environment='development',
                allowed_patterns=[
                    r'^https?://localhost(:\d+)?$',
                    r'^https?://127\.0\.0\.1(:\d+)?$',
                    r'^\*$' # Allow wildcard in dev if needed, or rely on explicit
                ],
                allow_wildcards=True
            ),
            'test': cls(
                environment='test',
                allowed_patterns=[
                    r'^https?://test(:\d+)?$',
                    r'^\*$'
                ],
                allow_wildcards=True
            ),
            'production': cls(
                environment='production',
                allowed_patterns=[
                    r'^https://[\w\-]+(\.[\w\-]+)*\.netlify\.app$',
                    r'^https://[\w\-]+(\.[\w\-]+)+$'
                ],
                allow_wildcards=False
            )
        }
        return configs.get(env, configs['production'])

def parse_cors_origins(origins_str: str, config: CorsConfig) -> List[str]:
    """Parse and validate CORS origins against environment config."""
    origins = [o.strip() for o in origins_str.split(",") if o.strip()]
    validated = []

    for origin in origins:
        if '*' in origin:
            if not config.allow_wildcards:
                logger.warning(f"Wildcard origin rejected in {config.environment}")
                continue
            # If wildcards allowed and origin is just '*', verify if we want to add it literally or skip validation
            if origin == '*':
                validated.append(origin)
                continue

        if any(re.match(p, origin) for p in config.allowed_patterns):
            validated.append(origin)
        else:
            logger.warning(f"Origin '{origin}' rejected by policy for {config.environment}")

    # Fallback for empty validated list if env is dev, or just return empty
    if not validated and config.environment != 'production':
         return ['http://localhost:5173', 'http://127.0.0.1:5173']

    return validated
