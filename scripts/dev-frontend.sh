#!/usr/bin/env bash
set -euo pipefail

echo "Starting frontend (Vite)..."
if pnpm exec vite 2>&1 | tee /tmp/frontend-dev.log; then
  exit 0
else
  if grep -q "ENOSPC" /tmp/frontend-dev.log || grep -q "System limit for number of file watchers reached" /tmp/frontend-dev.log; then
    echo "File watch limit reached; retrying with polling mode (CHOKIDAR_USEPOLLING=1)."
    export CHOKIDAR_USEPOLLING=true
    export CHOKIDAR_USEPOLLING=true
    exec pnpm exec vite
  else
    echo "Frontend dev failed; see /tmp/frontend-dev.log for details."
    exit 1
  fi
fi
