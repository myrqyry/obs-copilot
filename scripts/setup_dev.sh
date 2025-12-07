#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting OBS Copilot Development Setup...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js and npm
echo -e "\n${YELLOW}🔍 Checking Node.js and npm...${NC}"
if ! command_exists node || ! command_exists npm; then
    echo -e "${RED}❌ Node.js and npm are required. Please install them from https://nodejs.org/ and try again.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Found Node.js $NODE_VERSION and npm $NPM_VERSION${NC}"

# Install frontend dependencies
echo -e "\n${YELLOW}📦 Installing frontend dependencies...${NC}"
pnpm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"

# Setup backend
echo -e "\n${YELLOW}🚀 Setting up backend...${NC}"
./scripts/setup_backend.sh

# Check if backend setup was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend setup failed. Please check the logs above for details.${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Development environment setup completed successfully!${NC}"
if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
    CURRENT_WATCHES=$(cat /proc/sys/fs/inotify/max_user_watches)
    if [ "$CURRENT_WATCHES" -lt 524288 ]; then
        echo -e "\n${YELLOW}⚠️  Your inotify watch limit (${CURRENT_WATCHES}) may be low and could cause dev servers to fail with 'watch limit' errors.${NC}"
        echo -e "${BLUE}If you see errors when running 'pnpm dev', increase it temporarily with:${NC}"
        echo -e "  sudo sysctl -w fs.inotify.max_user_watches=524288"
        echo -e "Or to persist across reboots, add 'fs.inotify.max_user_watches=524288' to /etc/sysctl.conf and run 'sudo sysctl -p'.\n"
    fi
fi
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Start the development server: ${YELLOW}pnpm dev${NC}"
echo -e "   - Frontend will be available at ${YELLOW}http://localhost:5173${NC}"
echo -e "   - Backend API will be available at ${YELLOW}http://localhost:8000${NC}"
echo -e "\n2. For production build: ${YELLOW}pnpm build${NC}"
echo -e "\n${BLUE}Happy coding! 🚀${NC}"
