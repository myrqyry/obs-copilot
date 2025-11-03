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
    message: str = Field(..., min_length=1, max_length=1000)
    context: Optional[str] = Field(None, max_length=500)
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)