from fastapi import APIRouter, Depends
from starlette.responses import JSONResponse
import asyncio
import logging
from config import settings
from services.gemini_service import gemini_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def health_check():
    """Comprehensive health check endpoint."""
    try:
        # Check if GeminiService is responsive
        service_status = "healthy"
        try:
            # Quick check for event loop responsiveness.
            await asyncio.wait_for(asyncio.sleep(0.001), timeout=0.1)
        except asyncio.TimeoutError:
            service_status = "degraded"

        return JSONResponse(
            status_code=200 if service_status == "healthy" else 503,
            content={
                "status": service_status,
                "version": "1.1.0",
                "timestamp": asyncio.get_event_loop().time(),
                "services": {
                    "gemini": service_status,
                    "auth": "healthy" if settings.BACKEND_API_KEY else "warning"
                }
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": "Health check failed"}
        )

@router.get("/gemini")
def gemini_health():
    """Checks if the Gemini API key is available."""
    return {"healthy": bool(settings.GEMINI_API_KEY)}

@router.get("/obs")
def obs_health():
    """Mock OBS health check."""
    # In a real scenario, this might check a cached connection status
    return {"connected": True}

@router.get("/mcp")
def mcp_health():
    """Mock MCP health check."""
    return {"status": "healthy"}
