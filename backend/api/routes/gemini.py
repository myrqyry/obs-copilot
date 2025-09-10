import base64
import logging
import json
import os
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
# Corrected imports according to guidelines
from google import genai
from google.genai import types
from google.genai.errors import APIError

try:
    from .auth import get_api_key
except ImportError:
    from auth import get_api_key

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models remain the same
class EnhancedImageGenerateRequest(BaseModel):
    prompt: str
    model: str = "imagen-4.0-fast-generate-001"
    imageFormat: str = "png"
    aspectRatio: str = "1:1"
    personGeneration: str = "allow_adult"
    imageInput: Optional[str] = None
    imageInputMimeType: Optional[str] = None

class StreamRequest(BaseModel):
    prompt: str
    model: str = "gemini-2.5-flash"
    history: Optional[List[Dict]] = None

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured",
        )
    # Corrected client initialization
    return genai.Client(api_key=api_key)

def stream_generator(response):
    # This generator is now synchronous as per the guidelines
    total_tokens = 0
    try:
        for chunk in response:
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
def stream_content(request: StreamRequest, client: genai.Client = Depends(get_gemini_client)):
    # Corrected implementation using client.models.generate_content_stream
    try:
        contents = []
        if request.history:
            for msg in request.history:
                role = "user" if msg['role'] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(p['text']) for p in msg['parts']]))
        
        contents.append(types.Content(role="user", parts=[types.Part.from_text(request.prompt)]))

        response_stream = client.models.generate_content_stream(
            model=request.model,
            contents=contents
        )
        
        return StreamingResponse(stream_generator(response_stream), media_type="text/event-stream")
    except APIError as e:
        logger.error(f"Gemini API error in stream_content endpoint: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error in stream_content endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

@router.post("/generate-image-enhanced", dependencies=[Depends(get_api_key)])
def generate_image_enhanced(request: EnhancedImageGenerateRequest, client: genai.Client = Depends(get_gemini_client)):
    # Corrected synchronous implementation
    try:
        if request.imageInput and request.imageInputMimeType:
            image_bytes = base64.b64decode(request.imageInput)
            image_input_part = types.Part.from_bytes(data=image_bytes, mime_type=request.imageInputMimeType)
            
            # Logic for image editing
            request.model = "gemini-2.5-flash-image-preview"
            response = client.models.generate_content(
                model=request.model,
                contents=[image_input_part, request.prompt],
            )
            images_data = []
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    images_data.append({
                        "data": base64.b64encode(part.inline_data.data).decode(),
                        "mime_type": part.inline_data.mime_type
                    })
            return {"images": images_data, "model": request.model}
        else:
            # Logic for image generation
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
            images = [{"data": base64.b64encode(img.image.image_bytes).decode(), "mime_type": f"image/{request.imageFormat}"} for img in result.generated_images]
            return {"images": images, "model": request.model}

    except APIError as e:
        logger.error(f"Gemini API error in image generation: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error in image generation: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")
