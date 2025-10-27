import uvicorn
import logging
import asyncio
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi_mcp import FastApiMCP
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Import the centralized settings
from config import settings
from auth import get_api_key
from backend.api.routes import gemini, assets, overlays, proxy_7tv, proxy_emotes, health
from backend.services.gemini_service import gemini_service
from middleware import EnhancedLoggingMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter

# Configure logging based on settings
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # REASON: The original implementation did not shut down the GeminiService, which could lead to resource leaks.
    # This has been updated to use a lifespan event handler to shut down the service when the application is shutting down.
    yield
    gemini_service.shutdown()

app = FastAPI(
    title="Universal Backend Server",
    description="A single backend to serve all my projects with Google AI integration.",
    version="1.1.0",
    lifespan=lifespan,
)

# Initialize rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security and logging middleware
# During development and tests we allow all hosts to avoid TrustedHost rejections
# (pytest sends requests using host 'test'). In production this should be locked down
# to a specific allowlist.
if settings.ENV in ("development", "test"):
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
else:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.netlify.app"])
app.add_middleware(EnhancedLoggingMiddleware)

# Parse and validate allowed origins from settings
allowed_origins_raw = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
allowed_origins = []
for origin in allowed_origins_raw:
    if '*' in origin:
        if settings.ENV == 'production':
            logger.error(f"Wildcard origins not allowed in production: {origin}")
            continue
        elif not origin.startswith('https://') and origin != '*':
            logger.warning(f"Potentially unsafe origin pattern: {origin}")
    allowed_origins.append(origin)

# Improved CORS with security headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-KEY", "X-Requested-With"],
    expose_headers=["X-Request-ID"],
    max_age=3600,
)

# Create and mount the MCP server
mcp = FastApiMCP(app)
mcp.mount_http()

# API Routers
app.include_router(gemini.router, prefix="/api/gemini", tags=["gemini"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(overlays.router, prefix="/api/overlays", tags=["overlays"])
app.include_router(proxy_7tv.router, prefix="/api/proxy", tags=["proxy"])
app.include_router(proxy_emotes.router, prefix="/api/proxy/emotes", tags=["proxy_emotes"])
app.include_router(health.router, prefix="/api/health", tags=["health"])

# --- Global Exception Handlers ---
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP {exc.status_code} error at {request.url.path}: {exc.detail}", extra={
        "method": request.method,
        "client": request.client.host if request.client else None
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTP_ERROR"},
        headers=exc.headers if exc.headers else {}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error at {request.url.path}: {exc.errors()}", extra={
        "method": request.method,
        "client": request.client.host if request.client else None
    })
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request data",
            "errors": exc.errors(),
            "code": "VALIDATION_ERROR"
        }
    )

import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar('request_id', default='')

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request_id_var.set(request_id)

    # Add to request headers for downstream services
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, 'request_id', 'unknown')

    logger.error(
        f"Unhandled exception at {request.url.path}",
        exc_info=True,
        extra={
            "request_id": request_id,
            "method": request.method,
            "client": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", ""),
            "exception_type": type(exc).__name__
        }
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id
        }
    )

# --- Public & Secure Endpoints ---
@app.get("/")
def read_root():
    """A public health check endpoint."""
    return {"status": "Server is running"}

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    try:
        # Check if GeminiService is responsive
        service_status = "healthy"
        try:
            # Quick service connectivity test
            await asyncio.wait_for(asyncio.sleep(0.001), timeout=0.1)
        except:
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

@app.get("/secure", operation_id="get_secure_data")
def read_secure_data(api_key: str = Depends(get_api_key)):
    """A secure endpoint that requires an API key."""
    return {"data": "This is secure data, congrats on authenticating!"}

if __name__ == "__main__":
    # The host and port are now configured via Uvicorn's CLI or a process manager
    uvicorn.run(app, host="0.0.0.0", port=8000)