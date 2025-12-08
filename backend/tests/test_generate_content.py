import base64
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


class FakeInlineData:
    def __init__(self, data: bytes, mime_type: str):
        self.data = data
        self.mime_type = mime_type


class FakePart:
    def __init__(self, inline_data=None, text=None, uri=None):
        self.inline_data = inline_data
        self.text = text
        self.uri = uri


class FakeContent:
    def __init__(self, parts):
        self.parts = parts


class FakeCandidate:
    def __init__(self, content):
        self.content = content


class FakeResponse:
    def __init__(self, candidates):
        self.candidates = candidates


@pytest.mark.asyncio
async def test_generate_content_with_inline_audio(monkeypatch):
    # Prepare fake response that includes inline audio bytes
    audio_bytes = b"FAKEAUDIO"
    part = FakePart(inline_data=FakeInlineData(audio_bytes, "audio/wav"))
    response_obj = FakeResponse([FakeCandidate(FakeContent([part]))])

    async def fake_run_in_executor(func, *args, **kwargs):
        return response_obj

    # Patch the gemini_service.run_in_executor to return our fake response
    from backend.services import gemini_service
    monkeypatch.setattr(gemini_service, "run_in_executor", fake_run_in_executor)

    payload = {
        "prompt": "Say hi",
        "model": "gemini-1.5-flash-001",
        "audio_inline": {
            "data": base64.b64encode(audio_bytes).decode(),
            "mime_type": "audio/wav"
        }
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/gemini/generate-content", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert "candidates" in body
    assert len(body["candidates"]) == 1
    parts = body["candidates"][0]["parts"]
    assert parts[0]["mime_type"] == "audio/wav"
    assert parts[0]["inline_data"] == base64.b64encode(audio_bytes).decode()
