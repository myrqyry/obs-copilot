import pytest
import base64
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock
from backend.main import app
from backend.api.routes.gemini import get_gemini_client

VALID_API_KEY = "test-api-key"

# Create a mock Gemini client
mock_gemini_client = MagicMock()

# Configure the mock response for generate_images
mock_generated_image = MagicMock()
mock_generated_image.image.image_bytes = b"mock_image_data"
mock_generated_image.image.mime_type = "image/png"

mock_image_response = MagicMock()
mock_image_response.generated_images = [mock_generated_image]
mock_gemini_client.models.generate_images.return_value = mock_image_response

async def override_get_gemini_client():
    return mock_gemini_client

app.dependency_overrides[get_gemini_client] = override_get_gemini_client

@pytest.fixture(autouse=True)
def override_api_keys(monkeypatch):
    """Fixture to set the API_KEYS environment variable for tests."""
    monkeypatch.setenv("API_KEYS", VALID_API_KEY)
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
