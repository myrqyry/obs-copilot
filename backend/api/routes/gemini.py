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
    model: str = "imagen-4.0-fast-generate-001"
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
async def generate_image_enhanced(
    request: EnhancedImageGenerateRequest, client: genai.Client = Depends(get_gemini_client)
):
    """
    Enhanced image generation using Gemini 1.5 Flash with comprehensive parameters.
    Supports both text-to-image and image-to-image editing.
    """
    try:
        result = client.models.generate_images(
            model=request.model,
            prompt=request.prompt,
            config=dict(
                number_of_images=1,
                output_mime_type=f"image/{request.imageFormat}",
                person_generation=request.personGeneration,
                aspect_ratio=request.aspectRatio,
            ),
        )

        images = [
            {
                "data": base64.b64encode(img.image.image_bytes).decode(),
                "mime_type": f"image/{request.imageFormat}",
            }
            for img in result.generated_images
        ]

        return {
            "images": images,
            "model": request.model,
            "prompt": request.prompt,
            "config": {
                "imageFormat": request.imageFormat,
                "aspectRatio": request.aspectRatio,
                "personGeneration": request.personGeneration,
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
