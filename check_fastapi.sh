#!/bin/bash
cd backend
uv run python -c "import fastapi; print('FastAPI imported successfully!')"
cd ..