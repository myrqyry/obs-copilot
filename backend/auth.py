# auth.py
import os
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=True)

async def get_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv('BACKEND_API_KEY', 'dev-key')
    if api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key