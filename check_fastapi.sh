#!/bin/bash
cd backend
pipenv run python -c "import fastapi; print('FastAPI imported successfully!')"
cd ..