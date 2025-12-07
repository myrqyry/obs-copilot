import uvicorn
import logging
import asyncio
import time
from typing import Tuple, Any, Dict
from enum import IntEnum
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse
from fastapi_mcp import FastApiMCP
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Import the centralized settings
from config import settings
from config.cors import CorsConfig, parse_cors_origins
from config.validation import validate_environment, ValidationError
from auth import get_api_key
from api.routes import gemini, assets, overlays, proxy_7tv, proxy_emotes, health
from api.routes import knowledge
from services.gemini_service import gemini_service
from middleware import EnhancedLoggingMiddleware
from middleware.timeout import TimeoutMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter
from utils.error_handlers import ErrorCode, ErrorDetail, create_error_response, log_error, get_request_id

# Configure logging based on settings
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up OBS Copilot backend...")
    
    # Validate environment first
    try:
        validate_environment(settings)
    except ValidationError as e:
        logger.critical(f"Startup failed during environment validation: {e}")
        raise

    # Initialize services
    try:
        await gemini_service.initialize()
        logger.info("GeminiService initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize GeminiService: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down OBS Copilot backend...")

    try:
        # Give ongoing requests time to complete
        shutdown_timeout = 10.0
        await asyncio.wait_for(
            gemini_service.shutdown(),
            timeout=shutdown_timeout
        )
        logger.info("GeminiService shut down successfully")
    except asyncio.TimeoutError:
        logger.warning(f"GeminiService shutdown exceeded {shutdown_timeout}s timeout")
    except Exception as e:
        logger.error(f"Error during GeminiService shutdown: {e}")

    logger.info("Backend shutdown complete")

app = FastAPI(
    title="Universal Backend Server",
    description="A single backend to serve all my projects with Google AI integration.",
    version="1.1.0",
    lifespan=lifespan,
)

# Initialize rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Add security headers
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self'"
        )

        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]

        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Limit request body size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 50 * 1024 * 1024:  # 50MB limit
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large (max 50MB)"}
            )

        # Add processing time header for monitoring
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        return response

# --- Middleware Configuration (Order matters! LIFO for add_middleware) ---

class MiddlewarePriority(IntEnum):
    """Middleware execution priority (lower number = runs first in request pipeline)."""
    TRUSTED_HOST = 1      # First line of defense
    SECURITY_HEADERS = 2  # Security policies
    CORS = 3              # Cross-origin handling
    VALIDATION = 4        # Request validation
    TIMEOUT = 5           # Request timeouts
    LOGGING = 6           # Logging (closest to app logic)

def register_middleware_stack(app: FastAPI):
    """
    Register middleware in execution order (first registered = first to process requests).
    Request flow: TrustedHost → Security → CORS → Validation → Timeout → Logging → Routes
    """

    cors_config = CorsConfig.for_environment(settings.ENV)
    allowed_origins = parse_cors_origins(settings.ALLOWED_ORIGINS, cors_config)

    middleware_pipeline = [
        ("TrustedHost", TrustedHostMiddleware, {"allowed_hosts": ["*"] if settings.ENV in ("development", "test") else ["localhost", "127.0.0.1", "*.netlify.app"]}),
        ("SecurityHeaders", SecurityMiddleware, {}),
        ("CORS", CORSMiddleware, {
            "allow_origins": allowed_origins,
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-API-KEY", "X-Requested-With"],
            "expose_headers": ["X-Request-ID"],
            "max_age": 3600,
        }),
        ("RequestValidation", RequestValidationMiddleware, {}),
        ("Timeout", TimeoutMiddleware, {"timeout": settings.REQUEST_TIMEOUT}),
        ("EnhancedLogging", EnhancedLoggingMiddleware, {}),
    ]

    logger.info("Registering middleware pipeline in execution order:")
    for idx, (name, middleware_class, kwargs) in enumerate(middleware_pipeline, 1):
        logger.info(f"  {idx}. {name} ({middleware_class.__name__})")
        app.add_middleware(middleware_class, **kwargs)

    logger.info("Middleware pipeline configured successfully")

# Register middleware
register_middleware_stack(app)

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
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])

# --- Global Exception Handlers ---
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = get_request_id(request)
    await log_error(
        request=request,
        error_type='HTTP_ERROR',
        message=f"HTTP {exc.status_code}: {exc.detail}",
        status_code=exc.status_code
    )
    return create_error_response(
        status_code=exc.status_code,
        detail=exc.detail,
        code=ErrorCode.HTTP_ERROR,
        request_id=request_id,
        headers=exc.headers if exc.headers else None,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = get_request_id(request)
    errors = [
        ErrorDetail(field='.'.join(str(loc) for loc in error['loc']), message=error['msg'], type=error['type'])
        for error in exc.errors()
    ]
    await log_error(
        request=request,
        error_type='VALIDATION_ERROR',
        message='Request validation failed',
        status_code=422
    )
    return create_error_response(
        status_code=422,
        detail='Request validation failed',
        code=ErrorCode.VALIDATION_ERROR,
        request_id=request_id,
        errors=errors,
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
    request_id = get_request_id(request)
    await log_error(
        request=request,
        error_type=type(exc).__name__,
        message='Unhandled exception occurred',
        status_code=500,
        exc_info=exc,
    )
    return create_error_response(
        status_code=500,
        detail='An unexpected error occurred. Please try again later.',
        code=ErrorCode.INTERNAL_ERROR,
        request_id=request_id,
    )

# --- Public & Secure Endpoints ---
@app.get("/")
def read_root():
    """A public health check endpoint."""
    return {"status": "Server is running"}



@app.get("/secure", operation_id="get_secure_data")
def read_secure_data(api_key: str = Depends(get_api_key)):
    """A secure endpoint that requires an API key."""
    return {"data": "This is secure data, congrats on authenticating!"}

if __name__ == "__main__":
    # The host and port are now configured via Uvicorn's CLI or a process manager
    uvicorn.run(app, host="0.0.0.0", port=8000)
