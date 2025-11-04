from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re

class OBSConnectionRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=255)
    password: Optional[str] = Field(None, max_length=100)

    @validator('url')
    def validate_websocket_url(cls, v):
        if not re.match(r'^wss?://[\w.-]+(:\d+)?/?$', v):
            raise ValueError('Invalid WebSocket URL format')
        return v

    @validator('password')
    def validate_password(cls, v):
        if v and len(v.strip()) == 0:
            return None
        return v

class GeminiRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field("gemini-1.5-flash-latest")
    history: Optional[List[dict]] = Field(None)

PROMPT_MAX_LENGTH = 1000

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=PROMPT_MAX_LENGTH)
    model: str = Field("imagen-4.0-fast-generate-001")
    image_format: str = Field("png", pattern=r"^(png|jpeg|webp)$")
    aspect_ratio: str = Field("1:1", pattern=r"^(1:1|3:4|4:3|9:16|16:9)$")
    person_generation: str = Field("allow_adult", pattern=r"^(allow_adult|dont_allow)$")
    image_input: Optional[str] = Field(None)
    image_input_mime_type: Optional[str] = Field(None)

    @root_validator
    def check_image_input_dependencies(cls, values):
        image_input, mime_type = values.get('image_input'), values.get('image_input_mime_type')
        if image_input and not mime_type:
            raise ValueError('image_input_mime_type is required when image_input is provided')
        if mime_type and not image_input:
            raise ValueError('image_input is required when image_input_mime_type is provided')
        return values

class SpeechGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000)
    model: str = Field("gemini-1.5-flash-tts-001")