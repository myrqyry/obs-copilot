import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from google import genai  # type: ignore
from google.genai import types  # type: ignore
from .gemini_client import get_client

from ..config import settings
from .gemini_service import gemini_service

logger = logging.getLogger(__name__)


class GeminiCacheService:
    """Manages Gemini API explicit caching for OBS Copilot using the
    Google GenAI SDK `genai.Client`.
    """

    def __init__(self):
        # Client will be retrieved from centralized factory when needed.
        try:
            self.client = get_client()
            logger.info("GeminiCacheService initialized and client configured.")
        except Exception as e:
            logger.warning(f"GenAI client creation failed: {e}", exc_info=True)
            self.client = None

        self.active_caches: Dict[str, Any] = {}

    def _generate_cache_key(self, system_instruction: str, obs_state: dict) -> str:
        """Generate a consistent cache key for similar OBS states"""
        normalized_state = {
            "scenes": sorted(obs_state.get("available_scenes", [])),
            "streaming": obs_state.get("streaming_status", False),
            "recording": obs_state.get("recording_status", False),
        }
        cache_data = {
            "system_instruction": system_instruction,
            "obs_state": normalized_state,
        }
        return hashlib.sha256(json.dumps(cache_data, sort_keys=True).encode()).hexdigest()

    async def get_or_create_cache(
        self, system_instruction: str, obs_state: dict, ttl_minutes: int = 30
    ) -> Optional[str]:
        """
        Get existing cache or create a new one for OBS context.
        Returns cache name if successful, None otherwise.
        """
        if not self.client:
            logger.error("Gemini client not initialized. Cannot create cache.")
            return None

        cache_key = self._generate_cache_key(system_instruction, obs_state)

        if cache_key in self.active_caches:
            cache_info = self.active_caches[cache_key]
            if datetime.now() < cache_info["expires"]:
                logger.info(f"Using existing cache: {cache_key}")
                return cache_info["name"]
            else:
                del self.active_caches[cache_key]

        try:
            logger.info(f"Creating new cache for key: {cache_key}")

            # New SDK expects a config dict for caches.create
            config = {
                'system_instruction': system_instruction,
                'contents': [
                    types.Content(
                        role='user',
                        parts=[
                            types.Part.from_text(
                                f"Current OBS State: {json.dumps(obs_state, indent=2)}"
                            )
                        ],
                    )
                ],
                'ttl': f"{ttl_minutes * 60}s",
            }

            cache = await gemini_service.run_in_executor(
                self.client.caches.create,
                model="gemini-1.5-flash-001",
                config=config,
            )

            self.active_caches[cache_key] = {
                "name": getattr(cache, 'name', None),
                "expires": datetime.now() + timedelta(minutes=ttl_minutes),
                "created": datetime.now(),
            }
            logger.info(f"Created new cache: {getattr(cache, 'name', '<unknown>')} (key: {cache_key})")
            return getattr(cache, 'name', None)

        except Exception as e:
            logger.error(f"Failed to create cache: {e}", exc_info=True)
            return None

    async def generate_with_cache(
        self, cache_name: str, user_prompt: str, model: str = "gemini-1.5-flash-001"
    ) -> Optional[Dict]:
        """Generate content using cached context"""
        if not self.client:
            logger.error("Gemini client not initialized. Cannot generate with cache.")
            return None

        try:
            response = await gemini_service.run_in_executor(
                self.client.models.generate_content,
                model=model,
                contents=user_prompt,
                config=types.GenerateContentConfig(cached_content=cache_name),
            )

            return {
                "text": getattr(response, 'text', None),
                "usage_metadata": {
                    "prompt_token_count": getattr(response.usage_metadata, 'prompt_token_count', None),
                    "cached_content_token_count": getattr(response.usage_metadata, 'cached_content_token_count', None),
                    "candidates_token_count": getattr(response.usage_metadata, 'candidates_token_count', None),
                    "total_token_count": getattr(response.usage_metadata, 'total_token_count', None),
                },
            }
        except Exception as e:
            logger.error(f"Failed to generate with cache {cache_name}: {e}", exc_info=True)
            return None

    async def cleanup_expired_caches(self):
        """Clean up expired caches from the local tracking and remote service."""
        if not self.client:
            logger.error("Gemini client not initialized. Cannot clean up caches.")
            return 0

        now = datetime.now()
        expired_keys = [
            key
            for key, cache_info in self.active_caches.items()
            if now >= cache_info["expires"]
        ]

        cleaned_count = 0
        for key in expired_keys:
            cache_info = self.active_caches.pop(key, None)
            if not cache_info:
                continue

            try:
                await gemini_service.run_in_executor(
                    self.client.caches.delete, name=cache_info["name"]
                )
                logger.info(f"Deleted expired cache: {cache_info['name']}")
                cleaned_count += 1
            except Exception as e:
                logger.warning(
                    f"Failed to delete remote cache {cache_info['name']}: {e}",
                    exc_info=True,
                )

        return cleaned_count


# Singleton instance
gemini_cache_service = GeminiCacheService()