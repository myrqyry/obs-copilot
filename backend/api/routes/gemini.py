import base64
import logging
import json
import asyncio
from typing import Optional, List, Dict, AsyncGenerator
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from google.genai.errors import APIError as GenaiAPIError
try:
    from google.api_core.exceptions import APIError
except Exception:
    # Some installations of google libraries may not expose APIError under
    # google.api_core.exceptions. Fall back to a generic Exception so the
    # exception handlers still function without causing an import error.
    APIError = Exception

# Rate limiting
from rate_limiter import limiter

# Local imports
from services.gemini_service import gemini_service
from config import settings
from services.gemini_cache_service import gemini_cache_service
from services.obs_context_service import OBSContextBuilder, OBSContextState
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Pydantic Models ---
# (Models remain the same as they are for request body validation)
class EnhancedImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field("imagen-4.0-fast-generate-001", pattern=r"^(imagen-4\.0-(fast-)?generate-001|gemini-2\.5-flash-image-preview)$")
    imageFormat: str = Field("png", pattern=r"^(png|jpeg|webp)$")
    aspectRatio: str = Field("1:1", pattern=r"^(1:1|3:4|4:3|9:16|16:9)$")
    personGeneration: str = Field("allow_adult", pattern=r"^(allow_adult|dont_allow)$")
    imageInput: Optional[str] = Field(None, max_length=5000000)
    imageInputMimeType: Optional[str] = Field(None, pattern=r"^image/(jpeg|png|gif|webp)$")

class StreamRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field("gemini-2.5-flash", pattern=r"^(gemini-2\.5-(flash|pro)|gemini-2\.0-(flash|pro))$")
    history: Optional[List[Dict]] = Field(None, max_length=50)

class SpeechGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    isMultiSpeaker: bool = Field(False)
    voice: str = Field("Kore")
    speaker1Voice: str = Field("Kore")
    speaker2Voice: str = Field("Puck")

# --- Gemini Client Dependency ---
# Using a function to initialize the client once on startup
gemini_client = None
def _initialize_gemini_client():
    global gemini_client
    try:
        # Use API key from centralized settings
        genai.configure(api_key=settings.GEMINI_API_KEY)
        gemini_client = genai.GenerativeModel
        logger.info("Gemini client initialized successfully.")
    except Exception as e:
        logger.error(f"FATAL: Failed to initialize Gemini client: {e}", exc_info=True)
        # No client, so dependent endpoints will fail.
        gemini_client = None

_initialize_gemini_client()

def get_gemini_client():
    if gemini_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini service is not configured or available."
        )
    return gemini_client

# --- Asynchronous Streaming Logic ---
async def _async_stream_generator(response_iterator: any) -> AsyncGenerator[str, None]:
    """
    Wraps a synchronous iterator from the Gemini SDK into an async generator,
    preventing it from blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    total_tokens = 0
    try:
        while True:
            # Run the blocking next() call in a thread
            chunk = await loop.run_in_executor(None, next, response_iterator, None)
            if chunk is None:  # Reached the end of the iterator
                break

            if chunk.text:
                yield f"data: {json.dumps({'type': 'chunk', 'data': chunk.text})}\n\n"
            if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                total_tokens += chunk.usage_metadata.total_token_count
    except APIError as e:
        logger.error(f"Gemini API error during streaming: {e}")
        yield f"data: {json.dumps({'type': 'error', 'data': f'AI service error: {e.message}'})}\n\n"
    except Exception as e:
        logger.error(f"Unexpected error during streaming: {e}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'data': 'An unexpected error occurred during streaming.'})}\n\n"
    finally:
        yield f"data: {json.dumps({'type': 'usage', 'data': {'total_tokens': total_tokens}})}\n\n"

# --- API Endpoints ---
@router.post("/stream")
@limiter.limit("20/minute")
async def stream_content(request: Request, stream_request: StreamRequest, client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        model = client(stream_request.model)
        contents = []
        if stream_request.history:
            for msg in stream_request.history:
                role = "user" if msg['role'] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(p['text']) for p in msg['parts']]))
        
        contents.append(types.Content(role="user", parts=[types.Part.from_text(stream_request.prompt)]))

        # The initial call is blocking, so run it in the executor
        response_stream = await asyncio.wait_for(
            gemini_service.run_in_executor(
                model.generate_content,
                contents=contents,
                stream=True
            ),
            timeout=30.0
        )
        
        return StreamingResponse(_async_stream_generator(response_stream), media_type="text/event-stream")
    except asyncio.TimeoutError:
        logger.warning("Gemini stream request timed out.")
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail="Request to AI service timed out.")
    except (APIError, GenaiAPIError) as e:
        logger.error(f"Gemini API error in stream_content: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {e.message}")
    except HTTPException:
        raise # Re-raise HTTPExceptions from the service (e.g., timeout)
    except Exception as e:
        logger.error(f"Unexpected error in stream_content: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

def _sync_generate_image(client: genai.GenerativeModel, request: EnhancedImageGenerateRequest):
    """Synchronous helper for image generation to be run in an executor."""
    try:
        if request.imageInput and request.imageInputMimeType:
            try:
                image_bytes = base64.b64decode(request.imageInput, validate=True)
            except (base64.binascii.Error, ValueError) as e:
                logger.error(f"Invalid base64 image input: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid base64 image data"
                )
            # Image editing/remixing logic
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=request.imageInputMimeType)
            model = client("gemini-2.5-flash-image-preview")
            response = model.generate_content(contents=[image_part, request.prompt])
            
            images_data = []
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    images_data.append({
                        "data": base64.b64encode(part.inline_data.data).decode(),
                        "mime_type": part.inline_data.mime_type
                    })
            return {"images": images_data, "model": "gemini-2.5-flash-image-preview"}
        else:
            # Standard image generation
            model = client(request.model)
            result = model.generate_content(
                request.prompt,
                generation_config=dict(
                    number_of_images=1,
                    response_mime_type=f"image/{request.imageFormat}",
                ),
            )
            # Assuming the new SDK structure might return a single image part
            img_part = result.candidates[0].content.parts[0]
            img_bytes = img_part.inline_data.data
            images = [{"data": base64.b64encode(img_bytes).decode(), "mime_type": img_part.inline_data.mime_type}]
            return {"images": images, "model": request.model}
    except (APIError, GenaiAPIError, ValueError) as e:
        # Catch specific, expected errors from the SDK
        logger.error(f"Gemini SDK error in _sync_generate_image: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {str(e)}")


@router.post("/generate-image-enhanced")
@limiter.limit("10/minute")
async def generate_image_enhanced(request: Request, image_request: EnhancedImageGenerateRequest, client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        # Run the entire synchronous generation logic in the executor
        final_result = await asyncio.wait_for(
            gemini_service.run_in_executor(
                _sync_generate_image, client, image_request
            ),
            timeout=30.0
        )
        return final_result
    except asyncio.TimeoutError:
        logger.warning("Gemini image generation request timed out.")
        raise HTTPException(status_code=status.HTTP_408_REQUEST_TIMEOUT, detail="Request to AI service timed out.")
    except HTTPException:
        raise # Re-raise HTTPExceptions from the service or helper
    except Exception as e:
        logger.error(f"Unexpected error in generate_image_enhanced endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.post("/generate-speech")
@limiter.limit("30/minute")
async def generate_speech(request: Request, speech_request: SpeechGenerateRequest, client: genai.GenerativeModel = Depends(get_gemini_client)):
    try:
        model = client("gemini-2.5-flash-preview-tts")
        # The SDK call is blocking, so we run it in the executor
        response = await asyncio.wait_for(
            gemini_service.run_in_executor(
                model.generate_content,
                speech_request.text,
                generation_config=types.GenerationConfig(response_mime_type="audio/wav")
            ),
            timeout=30.0
        )

        audio_part = response.candidates[0].content.parts[0]
        audio_data = audio_part.inline_data.data

        return {
            "audioData": base64.b64encode(audio_data).decode(),
            "format": "wav",
            "model": "gemini-2.5-flash-preview-tts"
        }
    except (APIError, GenaiAPIError) as e:
        logger.error(f"Gemini API error in speech generation: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {e.message}")
    except HTTPException:
        raise # Re-raise timeout errors etc.
    except Exception as e:
        logger.error(f"Unexpected error in speech generation: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

# --- OBS-Aware Caching Endpoint ---

class OBSAwareRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field("gemini-1.5-flash-001")
    obs_state: Dict = Field(..., description="Current OBS state")
    use_explicit_cache: bool = Field(False, description="Use explicit caching for repeated contexts")
    cache_ttl_minutes: int = Field(30, ge=5, le=120, description="Cache TTL in minutes")

context_builder = OBSContextBuilder()

@router.post("/obs-aware-query")
@limiter.limit("15/minute")
async def obs_aware_query(
    request: Request,
    obs_request: OBSAwareRequest,
    client: genai.GenerativeModel = Depends(get_gemini_client)
):
    """
    Enhanced endpoint that uses OBS context and caching for better performance
    """
    try:
        obs_state = OBSContextState(
            current_scene=obs_request.obs_state.get('current_scene', ''),
            available_scenes=obs_request.obs_state.get('available_scenes', []),
            active_sources=obs_request.obs_state.get('active_sources', []),
            streaming_status=obs_request.obs_state.get('streaming_status', False),
            recording_status=obs_request.obs_state.get('recording_status', False),
            recent_commands=obs_request.obs_state.get('recent_commands', []),
            timestamp=datetime.now()
        )

        # Use explicit caching for complex OBS setups
        if obs_request.use_explicit_cache and len(obs_state.available_scenes) >= 3:
            cache_name = await gemini_cache_service.get_or_create_cache(
                system_instruction=context_builder.base_system_instruction,
                obs_state=obs_request.obs_state,
                ttl_minutes=obs_request.cache_ttl_minutes
            )

            if cache_name:
                # Generate using cached context
                result = await gemini_cache_service.generate_with_cache(
                    cache_name=cache_name,
                    user_prompt=obs_request.prompt,
                    model=obs_request.model
                )

                if result:
                    return {
                        "response": result['text'],
                        "usage_metadata": result['usage_metadata'],
                        "cache_used": True,
                        "cache_name": cache_name
                    }

        # Fallback to implicit caching with optimized, role-separated prompt structure
        system_message, user_message = context_builder.build_context_prompt(obs_state, obs_request.prompt)

        model = client(obs_request.model)

        # Build role-based contents: system message first (trusted), then user message (untrusted)
        contents = [
            types.Content(role="system", parts=[types.Part.from_text(system_message)]),
            types.Content(role="user", parts=[types.Part.from_text(user_message)])
        ]

        try:
            response = await asyncio.wait_for(
                gemini_service.run_in_executor(
                    model.generate_content,
                    contents=contents
                ),
                timeout=30.0  # 30 second timeout
            )

            return {
                "response": response.text,
                "usage_metadata": {
                    "total_token_count": getattr(response.usage_metadata, 'total_token_count', None),
                    "candidates_token_count": getattr(response.usage_metadata, 'candidates_token_count', None),
                    "prompt_token_count": getattr(response.usage_metadata, 'prompt_token_count', None)
                },
                "cache_used": False
            }
        except (APIError, GenaiAPIError) as e:
            logger.error(f"Gemini API error in obs_aware_query fallback: {e}")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI service error: {getattr(e, 'message', str(e))}")

    except Exception as e:
        logger.error(f"Error in obs_aware_query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process OBS-aware query"
        )

@router.post("/cache/cleanup")
async def cleanup_caches(request: Request):
    """Endpoint to manually trigger cache cleanup"""
    try:
        cleaned_count = await gemini_cache_service.cleanup_expired_caches()
        return {"message": f"Cleaned up {cleaned_count} expired caches"}
    except Exception as e:
        logger.error(f"Cache cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Cache cleanup failed")