FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY city-simulator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy common utilities (shared module)
COPY common/ /app/common/

# Copy application files
COPY city-simulator/*.py ./
COPY city-simulator/config/ ./config/

# Run the simulator
CMD ["python", "city_simulator.py"]
