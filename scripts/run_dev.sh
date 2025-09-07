#!/bin/bash
set -e

# Activate Python virtual environment
source backend/venv/bin/activate

# Start backend and frontend concurrently
concurrently "npm:frontend:dev" "npm:backend:dev-direct"
