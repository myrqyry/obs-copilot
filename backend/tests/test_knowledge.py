import os
import shutil
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


KB_DIR = Path.cwd() / 'memory_bank'


@pytest.fixture(autouse=True)
def ensure_settings_env(monkeypatch, tmp_path):
    # Ensure GEMINI_API_KEY and BACKEND_API_KEY are present for tests
    monkeypatch.setenv('GEMINI_API_KEY', 'A' * 32)
    monkeypatch.setenv('BACKEND_API_KEY', 'x' * 32)
    # Ensure a clean memory_bank for each test
    if KB_DIR.exists():
        shutil.rmtree(KB_DIR)
    KB_DIR.mkdir(parents=True, exist_ok=True)
    yield
    if KB_DIR.exists():
        shutil.rmtree(KB_DIR)


@pytest.mark.asyncio
async def test_create_and_fetch_knowledge():
    payload = {
        'title': 'Test Entry',
        'content': 'This is a test knowledge entry about testing.',
        'tags': ['test', 'unittest']
    }

    headers = {'X-API-KEY': os.environ.get('BACKEND_API_KEY')}

    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as ac:
        # Create
        r = await ac.post('/api/knowledge', json=payload, headers=headers)
        assert r.status_code == 201
        body = r.json()
        assert 'source' in body
        assert body['title'] == payload['title']

        # Search
        s = await ac.get('/api/knowledge/search', params={'query': 'testing', 'limit': 5})
        assert s.status_code == 200
        search_results = s.json()
        assert isinstance(search_results, list)
        assert any(r['source'] == body['source'] for r in search_results)

        # Get
        g = await ac.get(f"/api/knowledge/{body['source']}")
        assert g.status_code == 200
        entry = g.json()
        assert entry['title'] == payload['title']
        assert 'testing' in entry['content'] or 'test' in entry['content']


@pytest.mark.asyncio
async def test_get_knowledge_path_traversal_blocked():
    headers = {'X-API-KEY': os.environ.get('BACKEND_API_KEY')}
    payload = {
        'title': 'Traverse Entry',
        'content': 'This entry is used to test path traversal.',
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as ac:
        r = await ac.post('/api/knowledge', json=payload, headers=headers)
        assert r.status_code == 201
        body = r.json()
        # Attempt path traversal - should be blocked
        g = await ac.get('/api/knowledge/../../etc/passwd')
        assert g.status_code == 400


@pytest.mark.asyncio
async def test_search_when_kb_dir_missing():
    # Ensure KB_DIR is removed
    if KB_DIR.exists():
        shutil.rmtree(KB_DIR)
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as ac:
        s = await ac.get('/api/knowledge/search', params={'query': 'anything'})
        assert s.status_code == 200
        assert s.json() == []
