#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting OBS Copilot Backend Setup with uv...${NC}"

# Check Python installation
echo -e "\n${YELLOW}🔍 Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher and try again.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo -e "${GREEN}✓ Found Python $PYTHON_VERSION${NC}"

# Check uv installation
echo -e "\n${YELLOW}🔍 Checking uv installation...${NC}"
if ! command -v uv &> /dev/null; then
    echo -e "${RED}❌ uv is not installed. Please install it (see https://github.com/uv) or use your preferred Python environment manager.${NC}"
    exit 1
fi

UV_VERSION=$(uv --version 2>/dev/null || true)
echo -e "${GREEN}✓ Found uv $UV_VERSION${NC}"

# Navigate to backend directory
cd backend

echo -e "\n${YELLOW}📦 Installing Python dependencies with uv...${NC}"
uv install

echo -e "\n${GREEN}✅ Backend uv setup completed successfully!${NC}"
echo -e "\nTo start the backend server, run: ${YELLOW}pnpm dev${NC}"
echo -e "Or run uv commands directly: ${YELLOW}cd backend && uv run uvicorn main:app --reload${NC}\n"
