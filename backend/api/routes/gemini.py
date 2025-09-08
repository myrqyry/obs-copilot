import base64
import logging
import json
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
try:
    from .auth import get_api_key
except Exception:
    from auth import get_api_key
from google import genai
from google.generativeai import types

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

class StreamRequest(BaseModel):
    prompt: str
    model: str = "gemini-1.5-flash"
    history: Optional[List[Dict]] = None

def get_gemini_client():
    """Centralized Gemini client initialization with dependency injection pattern."""
    import os

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured",
        )
    genai.configure(api_key=api_key)
    return genai

async def stream_generator(response: types.AsyncGenerateContentResponse):
    """Generator function to format and stream response chunks."""
    total_tokens = 0
    try:
        async for chunk in response:
            if chunk.text:
                # Yield text chunk
                yield f"data: {json.dumps({'type': 'chunk', 'data': chunk.text})}\\n\n"
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                # Accumulate token count
                total_tokens += chunk.usage_metadata.total_token_count
    except Exception as e:
        logger.error(f"Error during streaming: {e}")
        yield f"data: {json.dumps({'type': 'error', 'data': 'An error occurred during streaming.'})}\\n\n"
    finally:
        # Yield final usage data
        yield f"data: {json.dumps({'type': 'usage', 'data': {'total_tokens': total_tokens}})}\\n\n"

@router.post("/stream", dependencies=[Depends(get_api_key)])
async def stream_content(
    request: StreamRequest,
    client: genai = Depends(get_gemini_client)
):
    """Streams generated content from Gemini."""
    try:
        model = client.GenerativeModel(request.model)
        
        # Start a chat session with the provided history
        chat = model.start_chat(
            history=request.history if request.history else []
        )

        # Send the new prompt and get a streaming response
        response = await chat.send_message(
            request.prompt,
            stream=True,
        )
        
        return StreamingResponse(
            stream_generator(response),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Error in stream_content endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate streaming content.",
        )

@router.post("/generate-image-enhanced", dependencies=[Depends(get_api_key)])
async def generate_image_enhanced(
    request: EnhancedImageGenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
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
