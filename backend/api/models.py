from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, Dict, Any
import re

class SearchRequest(BaseModel):
    """Validation for asset search queries."""
    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    api_name: str = Field(..., pattern=r"^(giphy|tenor|pixabay|pexels|unsplash|tenor_stickers|wallhaven|iconfinder|iconify|emoji-api)$")
    page: Optional[int] = Field(None, ge=1, le=100)
    limit: Optional[int] = Field(None, ge=1, le=50)

class ImageProxyRequest(BaseModel):
    """Validation for image proxy URL."""
    image_url: HttpUrl = Field(..., description="Valid image URL from allowed domains")

class PublishRequest(BaseModel):
    """Validation for overlay publish payload."""
    channel: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_]+$")
    message: Optional[Dict[str, Any]] = Field(None, description="Message data")
    data: Optional[Dict[str, Any]] = Field(None, description="Alternative data field")

class StreamRequest(BaseModel):
    """Validation for stream endpoint params."""
    channel: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_]+$")
    token: Optional[str] = Field(None, max_length=255)

class CosmeticsRequest(BaseModel):
    """Validation for 7TV cosmetics."""
    user_identifier: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")

class EmoteRequest(BaseModel):
    """Base validation for emote endpoints."""
    twitch_id: Optional[str] = Field(None, min_length=1, max_length=20, pattern=r"^\d+$")
    channel_name: Optional[str] = Field(None, min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
