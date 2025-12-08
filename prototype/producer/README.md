# Data Producer

## Overview

The Data Producer is a TypeScript application that generates mock sensor data and publishes it to Kafka topics. It simulates real-time data streams from various city systems including:
- Environmental sensors (air quality, PM2.5)
- Traffic sensors and cameras
- Building occupancy
- Weather stations
- Traffic graph updates
- Public transport GPS
- Emergency incidents

## Configuration

Environment variables (see `.env` or `docker-compose.yml`):
- `KAFKA_BROKERS`: Comma-separated list of Kafka broker addresses (default: `localhost:9092`)
- `KAFKA_CLIENT_ID`: Client identifier for Kafka (default: `data-producer`)
- `MESSAGE_INTERVAL_MS`: Interval between message batches in milliseconds (default: `2000`)

## Data Generation

### Traffic Graph Data

Traffic data uses **real edge IDs and road segment IDs** from the L'Aquila city graph (`laquila-city-graph-overture.json`):

- **Graph Size**: 3,459 edges (E-00000 to E-03458) and 4,030 nodes (N-00000 to N-04029)
- **Edge IDs**: Sampled pool of 500 edges from the full range
- **Road Segment IDs**: `RS-00000` through `RS-03458` (1:1 mapping with edge IDs)
- **Selection**: Randomly selects from the 500-edge sample pool for each message
- **Coordinates**: All location data uses L'Aquila coordinates (latitude 42.34-42.38, longitude 13.39-13.45)

#### Traffic Graph Message Format

```json
{
  "districtId": "DIST-001",
  "edgeId": "E-00015",
  "roadSegmentId": "RS-00015",
  "trafficConditions": {
    "averageSpeed": 35.5,
    "congestionLevel": "moderate",
    "vehicleCount": 45,
    "travelTime": 8.2,
    "incidents": []
  },
  "timestamp": "2025-01-01T10:30:00.000Z"
}
```

### Location Coordinates

All sensor and vehicle location data uses **L'Aquila, Italy coordinates**:
- Latitude: 42.34 to 42.38
- Longitude: 13.39 to 13.45

### Kafka Topics

The producer publishes to the following topics:
- `sensors.environmental` - Environmental sensor readings (PM2.5, air quality)
- `sensors.traffic` - Traffic sensor readings (cameras, vehicle counters)
- `buildings.occupancy` - Building occupancy levels
- `weather.stations` - Weather station readings
- `traffic.graph` - Real-time traffic conditions on road network edges
- `transport.gps` - Public transport vehicle GPS locations
- `emergency.incidents` - Emergency incident reports (occasional, 10% probability)

## Running Locally

```bash
npm install
npm run dev
```

## Running with Docker

```bash
docker build -t producer .
docker run -e KAFKA_BROKERS=kafka:9092 producer
```

## Integration with State Manager

The State Manager consumes these messages and updates the digital twin state in Redis. Traffic graph updates are applied to the city-level traffic graph using the real edge IDs from the L'Aquila graph data.

See `state-manager/docs/consumer-producer/KAFKA_DATA_FLOW.md` for complete data flow documentation.
