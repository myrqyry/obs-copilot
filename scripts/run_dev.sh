#!/bin/bash
set -e

# Prefer using 'uv' to run the backend in a managed environment
# Fallback to existing backend/venv activation if present
if command -v uv &> /dev/null; then
	USE_UV=1
else
	USE_UV=0
fi

if [[ $USE_UV -eq 0 && -f backend/venv/bin/activate ]]; then
	source backend/venv/bin/activate
fi

# Start backend and frontend concurrently
concurrently "npm:frontend:dev" "npm:dev:backend"
