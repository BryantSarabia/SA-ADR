FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements-graph.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-graph.txt

# Copy the script
COPY generate_laquila_graph.py .

# Create output directory
RUN mkdir -p /app/output

# Set the output directory as a volume
VOLUME ["/app/output"]

# Run the script
CMD ["python", "generate_laquila_graph.py"]
