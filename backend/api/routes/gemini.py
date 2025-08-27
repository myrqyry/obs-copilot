import base64
import logging
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from backend.auth import get_api_key
from google import genai
from google.genai import types

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


# Define comprehensive Pydantic model for image generation
class EnhancedImageGenerateRequest(BaseModel):
    prompt: str
    model: str = "gemini-1.5-pro-latest"
    imageFormat: str = "png"
    aspectRatio: str = "1:1"
    personGeneration: str = "allow_adult"
    responseModalities: Optional[List[str]] = None
    safetySettings: Optional[List[Dict]] = None
    imageInput: Optional[str] = None  # Base64 encoded image
    imageInputMimeType: Optional[str] = None


def get_gemini_client():
    """Centralized Gemini client initialization with dependency injection pattern."""
    import os

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured",
        )
    client = genai.Client(api_key=api_key)
    return client


@router.post("/generate-image-enhanced", dependencies=[Depends(get_api_key)])
async def generate_image_enhanced(request: EnhancedImageGenerateRequest):
    """
    Enhanced image generation using Gemini 1.5 Flash with comprehensive parameters.
    Supports both text-to-image and image-to-image editing.
    """
    try:
        client = get_gemini_client()
        
        # Build contents array
        contents = []

        # Add input image if provided (for image editing)
        if request.imageInput and request.imageInputMimeType:
            # Validate base64 image data
            try:
                base64.b64decode(request.imageInput)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid base64 image data provided.",
                )
            contents.append(
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": request.imageInputMimeType,
                                "data": request.imageInput,
                            }
                        }
                    ],
                }
            )

        # Add text prompt
        user_parts = [{"text": request.prompt}]

        # Add image generation instruction if not editing
        if not request.imageInput:
            user_parts.append(
                {
                    "text": f"Generate an image with format: {request.imageFormat}, aspect ratio: {request.aspectRatio}"
                }
            )

        contents.append({"role": "user", "parts": user_parts})

        # Build generation config
        generation_config = types.GenerateContentConfig(
            response_mime_type=(
                "application/json"
                if "TEXT" in (request.responseModalities or [])
                else None
            ),
            response_schema=(
                {
                    "type": "object",
                    "properties": {
                        "generated_images": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "image": {"type": "string"},
                                    "mime_type": {"type": "string"},
                                    "width": {"type": "integer"},
                                    "height": {"type": "integer"},
                                },
                            },
                        }
                    },
                }
                if "TEXT" in (request.responseModalities or [])
                else None
            ),
        )

        # Add safety settings if provided
        if request.safetySettings:
            safety_settings = []
            for setting in request.safetySettings:
                safety_settings.append(
                    {
                        "category": setting.get("category"),
                        "threshold": setting.get("threshold", "BLOCK_MEDIUM_AND_ABOVE"),
                    }
                )
            generation_config.safety_settings = safety_settings

        response = client.models.generate_content(
            model=request.model,
            contents=contents, 
            config=generation_config
        )

        # Extract image data from response
        images = []
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    images.append(
                        {
                            "data": part.inline_data.data,
                            "mime_type": part.inline_data.mime_type,
                            "width": getattr(part.inline_data, "width", None),
                            "height": getattr(part.inline_data, "height", None),
                        }
                    )

        if not images:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No image data generated",
            )

        return {
            "images": images,
            "model": request.model,
            "prompt": request.prompt,
            "config": {
                "imageFormat": request.imageFormat,
                "aspectRatio": request.aspectRatio,
                "personGeneration": request.personGeneration,
                "responseModalities": request.responseModalities,
            },
            "usage": {
                "prompt_token_count": (
                    response.usage_metadata.prompt_token_count
                    if response.usage_metadata
                    else None
                ),
                "candidates_token_count": (
                    response.usage_metadata.candidates_token_count
                    if response.usage_metadata
                    else None
                ),
                "total_token_count": (
                    response.usage_metadata.total_token_count
                    if response.usage_metadata
                    else None
                ),
            },
        }

    except Exception as e:
        # Handle specific exceptions
        if "APIError" in str(type(e)):
            logger.error(f"Gemini API error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service temporarily unavailable. Please try again later.",
            )
        elif "ValueError" in str(type(e)):
            logger.warning(f"Invalid request parameters: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request parameters provided.",
            )
        else:
            logger.error(f"Unexpected error in image generation: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred. Please try again later.",
            )