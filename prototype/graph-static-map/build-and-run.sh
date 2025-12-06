#!/bin/bash
# Build and run the L'Aquila Graph Generation Docker container

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}L'Aquila Graph Generation - Docker${NC}"
echo "===================================="

# Build the Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
docker build -t laquila-graph-generator .

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Docker build failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Docker image built successfully!${NC}"

# Create output directory if it doesn't exist
mkdir -p output

# Run the container
echo -e "\n${YELLOW}Running graph generation...${NC}\n"
docker run --rm -v "$(pwd)/output:/app/output" laquila-graph-generator

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Graph generation completed successfully!${NC}"
    echo -e "\n${GREEN}Output files are in the 'output' directory:${NC}"
    ls -lh output/
else
    echo -e "\n${RED}❌ Graph generation failed!${NC}"
    exit 1
fi
