import base64
import logging
import json
import os
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from google.genai.errors import APIError

try:
    from .auth import get_api_key
except Exception:
    from auth import get_api_key

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
    model: str = "gemini-2.5-flash"  # Default to gemini-2.5-flash
    history: Optional[List[Dict]] = None

def get_gemini_client():
    """Centralized Gemini client initialization with dependency injection pattern."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured",
        )
    return genai.Client(api_key=api_key)

async def stream_generator(response):
    """Generator function to format and stream response chunks."""
    total_tokens = 0
    try:
        async for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'type': 'chunk', 'data': chunk.text})}\n\n"
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                total_tokens += chunk.usage_metadata.total_token_count
    except APIError as e:
        logger.error(f"Gemini API error during streaming: {e}")
        yield f"data: {json.dumps({'type': 'error', 'data': f'AI service error: {e.message}'})}\n\n"
    except Exception as e:
        logger.error(f"Unexpected error during streaming: {e}")
        yield f"data: {json.dumps({'type': 'error', 'data': 'An unexpected error occurred during streaming.'})}\n\n"
    finally:
        yield f"data: {json.dumps({'type': 'usage', 'data': {'total_tokens': total_tokens}})}\n\n"

@router.post("/stream", dependencies=[Depends(get_api_key)])
async def stream_content(
    request: StreamRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Streams generated content from Gemini."""
    try:
        chat = client.chats.create(model=request.model)
        
        # Prepare history for the chat session
        # The history from the request might need to be converted to the format expected by genai.types.Content
        converted_history = []
        if request.history:
            for msg in request.history:
                # Assuming msg has 'role' and 'parts' where parts is a list of dicts with 'text'
                # This conversion might need adjustment based on actual history structure
                converted_history.append(types.Content(role=msg['role'], parts=[types.Part.from_text(p['text']) for p in msg['parts']]))

        # Reinitialize chat with converted history for each request to avoid state issues
        # Or, if history is meant to persist, use chat.send_message with a new message
        # For this implementation, we'll assume chat history is sent with each new request
        # and re-create the chat object to properly load the history.
        chat = client.chats.create(model=request.model, history=converted_history)

        response_stream = await chat.send_message_stream(
            request.prompt,
        )
        
        return StreamingResponse(
            stream_generator(response_stream),
            media_type="text/event-stream"
        )

    except APIError as e:
        logger.error(f"Gemini API error in stream_content endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service temporarily unavailable: {e.message}",
        )
    except Exception as e:
        logger.error(f"Unexpected error in stream_content endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while streaming content.",
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
        image_input_part = None
        if request.imageInput and request.imageInputMimeType:
            image_bytes = base64.b64decode(request.imageInput)
            image_input_part = types.Part.from_bytes(data=image_bytes, mime_type=request.imageInputMimeType)

        contents = [request.prompt]
        if image_input_part:
            contents.insert(0, image_input_part) # Prepend image for image-to-image

        # Use gemini-2.5-flash-image-preview for image editing if image input is provided
        if image_input_part and "gemini-2.5-flash-image-preview" not in request.model:
            logger.warning("Switching model to 'gemini-2.5-flash-image-preview' for image editing.")
            request.model = "gemini-2.5-flash-image-preview"
            # For image-editing model, generateContent is used instead of generate_images
            response = await client.models.generate_content(
                model=request.model,
                contents=contents,
            )
            # Extract image from response.candidates[0].content.parts
            generated_images_data = []
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    generated_images_data.append({
                        "data": part.inline_data.data,
                        "mime_type": part.inline_data.mime_type
                    })
            
            if not generated_images_data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No image data received from the image editing model.",
                )

            return {
                "images": generated_images_data,
                "model": request.model,
                "prompt": request.prompt,
                "config": {
                    "imageFormat": generated_images_data[0].get("mime_type", "image/png").split('/')[-1],
                    "aspectRatio": "N/A", # Aspect ratio not directly controlled for image-editing model
                    "personGeneration": "N/A", # Person generation not directly controlled for image-editing model
                },
            }
        
        else: # Regular image generation for imagen models
            result = await client.models.generate_images(
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

    except APIError as e:
        logger.error(f"Gemini API error in image generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service temporarily unavailable: {e.message}",
        )
    except ValueError as e:
        logger.warning(f"Invalid request parameters for image generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request parameters provided: {e}",
        )
    except Exception as e:
        logger.error(f"Unexpected error in image generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )