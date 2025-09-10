# main.py
import os
import uvicorn
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_mcp import FastApiMCP  # Import FastApiMCP
from dotenv import load_dotenv # Import load_dotenv

from .auth import get_api_key
from .api.routes import gemini, assets, overlays, proxy_7tv, proxy_emotes
from .middleware import logging_middleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the path to the .env file
dotenv_path = os.path.join(current_dir, ".env")
# Load environment variables from the .env file
load_dotenv(dotenv_path=dotenv_path)

# Get environment, default to 'development'
ENV = os.getenv("ENV", "development")

app = FastAPI(
    title="Universal Backend Server",
    description="A single backend to serve all my projects with Google AI integration.",
    version="1.1.0",
)

app.middleware("http")(logging_middleware)

# CORS configuration
if ENV == "production":
    allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
    if not allowed_origins_env:
        logger.error("FATAL: Server startup failed - ALLOWED_ORIGINS environment variable must be set in production.")
        raise RuntimeError("Server startup failed: ALLOWED_ORIGINS environment variable must be set for production.")
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin]
    if not allowed_origins or any("*" in origin for origin in allowed_origins) or any("localhost" in origin for origin in allowed_origins):
        logger.error("FATAL: Server startup failed - Invalid ALLOWED_ORIGINS configuration for production.")
        raise RuntimeError("FATAL: Server startup failed - Invalid ALLOWED_ORIGINS configuration for production.")
else:
    # Development origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization", "X-API-KEY"],
)

# Create the MCP server from our FastAPI app
mcp = FastApiMCP(app)

# Mount the MCP server to our app. It will be available at /mcp
mcp.mount_http()


@app.get("/")
def read_root():
    """A public health check endpoint."""
    return {"status": "Server is running"}


@app.get("/health")
def health_check():
    """Detailed health check endpoint."""
    # Add checks for other services here
    # For example, a check for the database connection
    # db_status = "available" if check_db_connection() else "unavailable"

    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.1.0",
            "services": {
                "gemini": "available" if os.getenv("GEMINI_API_KEY") else "unavailable",
                # "database": db_status,
            },
        }
    )


app.include_router(gemini.router, prefix="/api/gemini", tags=["gemini"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(overlays.router, prefix="/api/overlays", tags=["overlays"])
app.include_router(proxy_7tv.router, prefix="/api/proxy", tags=["proxy"])
app.include_router(proxy_emotes.router, prefix="/api/proxy/emotes", tags=["proxy_emotes"])


@app.get("/secure", operation_id="get_secure_data")
def read_secure_data(api_key: str = Depends(get_api_key)):
    """A secure endpoint that requires an API key."""
    return {"data": "This is secure data, congrats on authenticating!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)