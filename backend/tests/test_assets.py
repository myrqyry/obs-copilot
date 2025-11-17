import pytest
from httpx import AsyncClient, ASGITransport, Response, Request
from unittest.mock import patch, AsyncMock
from backend.main import app

VALID_API_KEY = "this-is-a-very-long-and-secure-api-key-for-testing"
GIPHY_API_KEY = "test-giphy-key"

@pytest.fixture(autouse=True)
def override_api_keys(monkeypatch):
    """Fixture to set environment variables for tests."""
    monkeypatch.setenv("BACKEND_API_KEY", VALID_API_KEY)
    monkeypatch.setenv("GIPHY_API_KEY", GIPHY_API_KEY)

@pytest.mark.asyncio
@patch('backend.api.routes.assets.httpx.AsyncClient')
async def test_search_assets_success(mock_async_client):
    # Configure the mock response from the external API
    mock_api_response = Response(
        200,
        json={"data": [{"id": "gif1", "title": "A Cat Gif"}]}
    )

    # Mock the AsyncClient context manager
    mock_async_client.return_value.__aenter__.return_value.get.return_value = mock_api_response

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/assets/search/giphy",
            headers={"X-API-KEY": VALID_API_KEY},
            params={"query": "cats"}
        )

    assert response.status_code == 200
    response_json = response.json()
    assert response_json["data"][0]["title"] == "A Cat Gif"
