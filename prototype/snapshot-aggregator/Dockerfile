FROM python:3.9-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY snapshot-aggregator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy common utilities (shared with other services)
COPY common /app/common

# Copy snapshot aggregator code
COPY snapshot-aggregator/*.py .
COPY snapshot-aggregator/config/ config/

# Set Python path
ENV PYTHONUNBUFFERED=1

# Run aggregator
CMD ["python", "snapshot_aggregator.py"]
