#!/bin/bash
# Build and run the L'Aquila Graph Generation using Docker Compose

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}L'Aquila Graph Generation - Docker Compose${NC}"
echo "==========================================="

# Create output directory if it doesn't exist
mkdir -p output

# Build and run with Docker Compose
echo -e "\n${YELLOW}Building Docker image with docker-compose...${NC}"
docker-compose build

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Docker image built successfully!${NC}"

# Run the container
echo -e "\n${YELLOW}Running Overture Maps download and graph generation...${NC}\n"
echo "This will:"
echo "  1. Download road segments from Overture Maps"
echo "  2. Download road connectors from Overture Maps"
echo "  3. Process and generate graph files"
echo ""

docker-compose up

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All operations completed successfully!${NC}"
    echo -e "\n${GREEN}Output files in 'output' directory:${NC}"
    ls -lh output/ | grep -v "^total"
    
    # Clean up container
    docker-compose down
else
    echo -e "\n${RED}❌ Operation failed!${NC}"
    docker-compose down
    exit 1
fi
