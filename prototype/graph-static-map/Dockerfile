FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including DuckDB
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install DuckDB CLI
RUN wget https://github.com/duckdb/duckdb/releases/download/v1.1.3/duckdb_cli-linux-amd64.zip \
    && unzip duckdb_cli-linux-amd64.zip -d /usr/local/bin/ \
    && rm duckdb_cli-linux-amd64.zip \
    && chmod +x /usr/local/bin/duckdb

# Copy requirements file
COPY requirements-graph.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-graph.txt

# Copy scripts
COPY generate_laquila_graph.py .
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Create output directory
RUN mkdir -p /app/output

# Set the output directory as a volume
VOLUME ["/app/output"]

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
