#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting OBS Copilot Backend Setup with Poetry...${NC}"

# Check Python installation
echo -e "\n${YELLOW}🔍 Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher and try again.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo -e "${GREEN}✓ Found Python $PYTHON_VERSION${NC}"

# Check Poetry installation
echo -e "\n${YELLOW}🔍 Checking Poetry installation...${NC}"
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}❌ Poetry is not installed. Please install it from https://python-poetry.org/docs/#installation${NC}"
    echo -e "${YELLOW}You can run: ${BLUE}curl -sSL https://install.python-poetry.org | python3 -${NC}"
    exit 1
fi

POETRY_VERSION=$(poetry --version | cut -d ' ' -f 3)
echo -e "${GREEN}✓ Found Poetry $POETRY_VERSION${NC}"

# Navigate to backend directory
cd backend

# Install dependencies with Poetry
echo -e "\n${YELLOW}📦 Installing Python dependencies with Poetry...${NC}"
poetry install

echo -e "\n${GREEN}✅ Backend Poetry setup completed successfully!${NC}"
echo -e "\nTo start the backend server, run: ${YELLOW}pnpm dev${NC}"
echo -e "Or run Poetry commands directly: ${YELLOW}cd backend && poetry run uvicorn main:app --reload${NC}\n"
