#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting OBS Copilot Backend Setup...${NC}"

# Check Python installation
echo -e "\n${YELLOW}🔍 Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher and try again.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo -e "${GREEN}✓ Found Python $PYTHON_VERSION${NC}"

# Create virtual environment
echo -e "\n${YELLOW}🚀 Creating virtual environment...${NC}"
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
    echo -e "${GREEN}✓ Virtual environment created at backend/venv${NC}"
else
    echo -e "${YELLOW}ℹ️ Virtual environment already exists at backend/venv${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}🚀 Activating virtual environment...${NC}"
source backend/venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}🔄 Upgrading pip...${NC}"
python -m pip install --upgrade pip

# Install requirements
echo -e "\n${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r backend/requirements.txt

echo -e "\n${GREEN}✅ Backend setup completed successfully!${NC}"
echo -e "\nTo start the backend server, run: ${YELLOW}source backend/venv/bin/activate && uvicorn backend.main:app --reload${NC}"
echo -e "Or use: ${YELLOW}npm run backend:dev${NC}\n"
