#!/bin/bash

# Culori pentru output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting WebPanel Installation...${NC}"

# --- Verificare Comenzi Necesare ---
echo -n "Checking for Docker..."
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${YELLOW}Error: Docker is not installed. Please install Docker and try again.${NC}" >&2
  exit 1
fi
echo -e "${GREEN}OK${NC}"

# --- Verificare Docker Compose ---
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${YELLOW}Error: Neither 'docker-compose' nor 'docker compose' was found. Please install Docker Compose and try again.${NC}" >&2
    exit 1
fi
echo -e "Found Docker Compose: ${GREEN}${COMPOSE_CMD}${NC}"

# --- Configurare .env ---
if [ -f ".env" ]; then
    echo -e "${YELLOW}.env file already exists. Skipping creation.${NC}"
else
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}.env file created successfully.${NC}"
fi

echo -e "\n${YELLOW}IMPORTANT:${NC} Please review the configuration in the ${GREEN}.env${NC} file before proceeding."
echo "You might want to change database passwords and the JWT secret."
read -p "Press [Enter] to continue with the installation..."

# --- Pornire Containere Docker ---
echo -e "\n${GREEN}Building and starting containers... (This may take a few minutes)${NC}"
$COMPOSE_CMD up --build -d

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Installation Complete!${NC}"
    echo "The control panel should be accessible at http://localhost (or your server's IP)."
    echo "Backend API is running on port 4000."
    echo -e "\nTo see logs, run: ${YELLOW}${COMPOSE_CMD} logs -f${NC}"
    echo -e "To stop the services, run: ${YELLOW}${COMPOSE_CMD} down${NC}"
else
    echo -e "\n${RED}Error: Docker Compose failed to start.${NC}" >&2
    echo "Please check the output above for errors."
    exit 1
fi

exit 0
