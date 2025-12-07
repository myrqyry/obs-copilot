"""Centralized Google GenAI client factory.

This module creates a single genai.Client instance using the configured
GEMINI_API_KEY from settings. Other modules should import get_client() to
access the client. Keeping a single factory simplifies testing and mocking.
"""
from typing import Optional
import logging
from google import genai  # type: ignore
from ..config import settings

logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None

def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not getattr(settings, 'GEMINI_API_KEY', None):
            logger.warning("GEMINI_API_KEY not configured; genai.Client will be created without an API key."
                           "Ensure GEMINI_API_KEY is set in production.")
        # Prefer explicit API key construction; genai.Client may also read env var
        try:
            _client = genai.Client(api_key=settings.GEMINI_API_KEY) if getattr(settings, 'GEMINI_API_KEY', None) else genai.Client()
            logger.info("Initialized google.genai.Client")
        except Exception as e:
            logger.exception("Failed to initialize google.genai.Client: %s", e)
            raise
    return _client
