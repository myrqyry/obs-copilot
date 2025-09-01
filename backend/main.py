# main.py
import os
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_mcp import FastApiMCP  # Import FastApiMCP
from dotenv import load_dotenv # Import load_dotenv

from backend.auth import get_api_key
from backend.api.routes import gemini
from backend.api.routes import assets
from backend.middleware import logging_middleware

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Universal Backend Server",
    description="A single backend to serve all my projects with Google AI integration.",
    version="1.1.0",
)

app.middleware("http")(logging_middleware)

# Load allowed origins from environment variable
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not allowed_origins or allowed_origins == [""]:
    allowed_origins = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]


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
    import os

    return JSONResponse(
        content={
            "status": "healthy",
            "version": "1.1.0",
            "services": {
                "gemini": "available" if os.getenv("GEMINI_API_KEY") else "unavailable"
            },
        }
    )


app.include_router(gemini.router, prefix="/api/gemini", tags=["gemini"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])


@app.get("/secure", operation_id="get_secure_data")
def read_secure_data(api_key: str = Depends(get_api_key)):
    """A secure endpoint that requires an API key."""
    return {"data": "This is secure data, congrats on authenticating!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
