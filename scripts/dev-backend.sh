#!/usr/bin/env bash
set -euo pipefail

# Start backend server with reload; if WatchFiles error occurs, fallback to no-reload
ROOT_DIR=$(pwd)
export PYTHONPATH="$ROOT_DIR"
CMD_RELOAD=(uv run uvicorn backend.main:app --reload --reload-dir backend --host 0.0.0.0 --port 8000)
CMD_NORELOAD=(uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000)

echo "Starting backend with reload..."
if ! ${CMD_RELOAD[@]} 2>&1 | tee /tmp/backend-dev.log; then
  if grep -q "OS file watch limit reached" /tmp/backend-dev.log; then
    echo "Watch limit reached; retrying without reload to continue development."
    exec ${CMD_NORELOAD[@]}
  else
    echo "Backend failed to start; check /tmp/backend-dev.log for details."
    exit 1
  fi
fi
