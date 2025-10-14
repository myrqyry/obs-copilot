from fastapi import APIRouter, Depends
from config import settings

router = APIRouter()

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
