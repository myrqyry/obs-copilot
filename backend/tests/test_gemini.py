import pytest
import base64
import sys
import os
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock

# Add the parent directory to the path so we can import backend modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app
from backend.api.routes.gemini import get_gemini_client

VALID_API_KEY = "dev-key"

# Create a mock Gemini client
mock_gemini_client = MagicMock()

# Configure the mock response for generate_images
mock_generated_image = MagicMock()
mock_generated_image.image.image_bytes = b"mock_image_data"
mock_generated_image.image.mime_type = "image/png"

mock_image_response = MagicMock()
mock_image_response.generated_images = [mock_generated_image]
mock_gemini_client.models.generate_images.return_value = mock_image_response

# Configure mock response for generate_content_stream (for streaming tests)
mock_stream_chunk = MagicMock()
mock_stream_chunk.text = "Hello world"
mock_stream_response = [mock_stream_chunk]
mock_gemini_client.models.generate_content_stream.return_value = mock_stream_response

def override_get_gemini_client():
    return mock_gemini_client

app.dependency_overrides[get_gemini_client] = override_get_gemini_client

@pytest.fixture(autouse=True)
def override_api_keys(monkeypatch):
    """Fixture to set the BACKEND_API_KEY environment variable for tests."""
    monkeypatch.setenv("BACKEND_API_KEY", VALID_API_KEY)
    # Also mock the GEMINI_API_KEY as it's checked by the real get_gemini_client
    # which is no longer called, but good practice to have it for other tests.
    monkeypatch.setenv("GEMINI_API_KEY", "not-a-real-key")

@pytest.mark.asyncio
async def test_generate_image_enhanced_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/gemini/generate-image-enhanced",
            headers={"X-API-KEY": VALID_API_KEY},
            json={"prompt": "a cat"}
        )

    assert response.status_code == 200
    response_json = response.json()
    assert "images" in response_json
    assert len(response_json["images"]) == 1
    assert response_json["images"][0]["data"] == base64.b64encode(b"mock_image_data").decode()
    assert response_json["images"][0]["mime_type"] == "image/png"
    assert "usage" not in response_json

@pytest.mark.asyncio
async def test_stream_content_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/gemini/stream",
            headers={"X-API-KEY": VALID_API_KEY},
            json={"prompt": "Hello", "model": "gemini-2.5-flash"}
        )

    assert response.status_code == 200
    # Check that the response is a streaming response
    assert response.headers.get("content-type") == "text/event-stream; charset=utf-8"
