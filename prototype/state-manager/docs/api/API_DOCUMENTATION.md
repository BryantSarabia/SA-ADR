# State Manager API Documentation

## Overview

The State Manager API provides RESTful endpoints to query the digital twin state of L'Aquila city. The API offers access to real-time city data including districts, buildings, sensors, public transport, and emergency services.

**Base URL:** `http://localhost:3000/api`

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Get Complete State](#get-complete-state)
  - [Get Districts](#get-districts)
  - [Get District by ID](#get-district-by-id)
  - [Get City Graph](#get-city-graph)
  - [Get Buildings](#get-buildings)
  - [Get Sensors](#get-sensors)
  - [Get Public Transport](#get-public-transport)
  - [Get Emergency Services](#get-emergency-services)
  - [Get State Snapshot](#get-state-snapshot)
  - [Get Latest Snapshot](#get-latest-snapshot)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Integration Examples](#integration-examples)

---

## Authentication

Currently, the API does not require authentication. In production environments, implement appropriate authentication mechanisms (e.g., API keys, JWT tokens).

---

## Endpoints

### Health Check

Check if the API server is running and responsive.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-08T10:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Server is healthy

**Example:**
```bash
curl http://localhost:3000/api/health
```

---

### Get Complete State

Retrieve the complete current state of the city digital twin.

**Endpoint:** `GET /state`

**Response:**
```json
{
  "city": {
    "name": "L'Aquila",
    "timestamp": "2024-12-08T10:30:00.000Z",
    "districts": [...],
    "publicTransport": {...},
    "emergencyServices": {...}
  }
}
```

**Status Codes:**
- `200 OK`: State retrieved successfully
- `404 Not Found`: No state available
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/state
```

---

### Get Districts

Retrieve all districts in the city.

**Endpoint:** `GET /state/districts`

**Response:**
```json
{
  "districts": [
    {
      "id": "district-1",
      "name": "Centro Storico",
      "buildings": [...],
      "sensors": [...],
      "graph": {...}
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Districts retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/districts
```

---

### Get District by ID

Retrieve a specific district by its ID.

**Endpoint:** `GET /state/districts/:id`

**Parameters:**
- `id` (path parameter): District identifier

**Response:**
```json
{
  "district": {
    "id": "district-1",
    "name": "Centro Storico",
    "buildings": [...],
    "sensors": [...],
    "graph": {...}
  }
}
```

**Status Codes:**
- `200 OK`: District retrieved successfully
- `404 Not Found`: District not found

**Example:**
```bash
curl http://localhost:3000/api/state/districts/district-1
```

---

### Get City Graph

Retrieve the road network graph for the entire city.

**Endpoint:** `GET /state/graph`

**Response:**
```json
{
  "graph": {
    "nodes": [
      {
        "id": "node-1",
        "location": {
          "lat": 42.3498,
          "lon": 13.3995
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "length": 150.5,
        "trafficData": {
          "averageSpeed": 45.5,
          "congestionLevel": "medium",
          "vehicleCount": 25,
          "travelTime": 3.5
        }
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Graph retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/graph
```

---

### Get Buildings

Retrieve all buildings in the city.

**Endpoint:** `GET /state/buildings`

**Response:**
```json
{
  "buildings": [
    {
      "id": "building-1",
      "type": "residential",
      "occupancy": 150,
      "energyConsumption": 250.5,
      "location": {
        "lat": 42.3498,
        "lon": 13.3995
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Buildings retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/buildings
```

---

### Get Sensors

Retrieve all sensors in the city (from city-simulator edge managers).

**Endpoint:** `GET /state/sensors`

**Response:**
```json
{
  "sensors": [
    {
      "sensorId": "speed-edge-centro-1",
      "type": "speed",
      "edgeId": "edge-centro-1",
      "value": 45.67,
      "unit": "km/h",
      "status": "active",
      "location": {
        "latitude": 42.3506,
        "longitude": 13.3992
      },
      "lastUpdated": "2025-12-21T10:30:00.000Z",
      "metadata": {
        "avgSpeed": 45.67,
        "sensorCount": 2
      }
    },
    {
      "sensorId": "camera-edge-centro-1",
      "type": "camera",
      "edgeId": "edge-centro-1",
      "value": 15,
      "unit": "vehicles",
      "status": "active",
      "location": {
        "latitude": 42.3506,
        "longitude": 13.3992
      },
      "lastUpdated": "2025-12-21T10:30:00.000Z",
      "metadata": {
        "roadCondition": "clear",
        "confidence": 0.92,
        "vehicleCount": 15,
        "congestionStatus": "free_flow"
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Sensors retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/sensors
```

---

### Get Public Transport

Retrieve public transport information including buses and status.

**Endpoint:** `GET /state/public-transport`

**Response:**
```json
{
  "publicTransport": {
    "buses": [
      {
        "id": "bus-1",
        "route": "Line 1",
        "location": {
          "lat": 42.3498,
          "lon": 13.3995
        },
        "passengers": 25,
        "capacity": 50,
        "status": "on-time"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Transport data retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/public-transport
```

---

### Get Emergency Services

Retrieve emergency services information including vehicles and incidents.

**Endpoint:** `GET /state/emergency-services`

**Response:**
```json
{
  "emergencyServices": {
    "vehicles": [
      {
        "id": "ambulance-1",
        "type": "ambulance",
        "status": "available",
        "location": {
          "lat": 42.3498,
          "lon": 13.3995
        }
      }
    ],
    "incidents": [
      {
        "id": "incident-1",
        "type": "medical",
        "severity": "high",
        "location": {
          "lat": 42.3498,
          "lon": 13.3995
        },
        "timestamp": "2024-12-08T10:25:00.000Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Emergency data retrieved successfully
- `404 Not Found`: No state available

**Example:**
```bash
curl http://localhost:3000/api/state/emergency-services
```

---

### Get State Snapshot

Retrieve a specific historical state snapshot by ID.

**Endpoint:** `GET /snapshots/:id`

**Parameters:**
- `id` (path parameter): Snapshot identifier

**Response:**
```json
{
  "snapshot": {
    "_id": "snapshot-id",
    "state": {...},
    "timestamp": "2024-12-08T10:00:00.000Z",
    "version": 1
  }
}
```

**Status Codes:**
- `200 OK`: Snapshot retrieved successfully
- `404 Not Found`: Snapshot not found
- `500 Internal Server Error`: Database error

**Example:**
```bash
curl http://localhost:3000/api/snapshots/snapshot-id
```

---

### Get Latest Snapshot

Retrieve the most recent state snapshot.

**Endpoint:** `GET /snapshots/latest`

**Response:**
```json
{
  "snapshot": {
    "_id": "snapshot-id",
    "state": {...},
    "timestamp": "2024-12-08T10:30:00.000Z",
    "version": 1
  }
}
```

**Status Codes:**
- `200 OK`: Latest snapshot retrieved successfully
- `404 Not Found`: No snapshots available
- `500 Internal Server Error`: Database error

**Example:**
```bash
curl http://localhost:3000/api/snapshots/latest
```

---

## Data Models

### City State
```typescript
interface CityState {
  cityId: string;
  timestamp: string;
  metadata: CityMetadata;
  districts: District[];
  publicTransport: PublicTransport;
  emergencyServices: EmergencyServices;
  cityGraph: CityGraph;
}

interface CityMetadata {
  name: string;
  version: string;
  lastUpdated: string;
}
```

### District
```typescript
interface District {
  districtId: string;
  name: string;
  location: {
    centerLatitude: number;
    centerLongitude: number;
    boundaries: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  sensors: Sensor[];
  buildings: Building[];
  weatherStations: WeatherStation[];
}
```

### Sensor (from city-simulator)
```typescript
interface Sensor {
  sensorId: string;
  type: 'speed' | 'camera' | string;  // Types from city-simulator
  edgeId?: string;                     // Edge ID from city-simulator
  value: number;
  unit: string;                        // 'km/h' for speed, 'vehicles' for camera
  status: 'active' | 'inactive' | 'error' | 'degraded';
  lastUpdated: string;
  location?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  metadata?: SensorMetadata;
}

// Metadata varies by sensor type
interface SensorMetadata {
  // Speed sensor metadata
  avgSpeed?: number;
  sensorCount?: number;
  readings?: SpeedSensorReading[] | CameraSensorReading[];
  
  // Camera sensor metadata
  roadCondition?: string;    // 'clear' | 'congestion' | 'accident' | 'obstacles' | 'flooding'
  confidence?: number;       // 0.0 - 1.0
  vehicleCount?: number;
  congestionStatus?: string; // 'free_flow' | 'congested' | 'blocked' | 'slow'
}

interface SpeedSensorReading {
  sensor_id: string;
  speed_kmh: number;
  latitude: number;
  longitude: number;
}

interface CameraSensorReading {
  sensor_id: string;
  road_condition: string;
  confidence: number;
  vehicle_count: number;
  latitude: number;
  longitude: number;
}
```

### Weather Station (from city-simulator)
```typescript
interface WeatherStation {
  stationId: string;
  name: string;
  edgeId?: string;          // Edge ID from city-simulator
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  readings: {
    temperature: number;    // Celsius
    humidity: number;       // Percentage
    weatherConditions?: string;  // 'clear' | 'cloudy' | 'rainy' | 'foggy' | 'snowy'
    pressure: number;       // hPa
    windSpeed: number;      // m/s
    windDirection: number;  // degrees
    precipitation: number;  // mm
    cloudCover: number;     // percentage
    visibility: number;     // meters
    uvIndex: number;
    units: {
      temperature: string;
      humidity: string;
      pressure: string;
      windSpeed: string;
      windDirection: string;
      precipitation: string;
      cloudCover: string;
      visibility: string;
    };
  };
  status: string;
  lastUpdated: string;
  metadata?: {
    sensorCount: number;
    readings: WeatherSensorReading[];
  };
}

interface WeatherSensorReading {
  sensor_id: string;
  temperature_c: number;
  humidity: number;
  latitude: number;
  longitude: number;
}
```

### Building
```typescript
interface Building {
  buildingId: string;
  name: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  floors: number;
  totalCapacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  sensors: Sensor[];
  status: string;
}
```

### City Graph
```typescript
interface CityGraph {
  nodes: Node[];
  edges: Edge[];
}

interface Node {
  nodeId: string;
  type: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  trafficLight?: TrafficLight;
}

interface Edge {
  edgeId: string;
  roadSegmentId: string;
  name: string;
  fromNode: string;
  toNode: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  distance: number;
  speedLimit: number;
  lanes: number;
  direction: string;
  trafficConditions?: TrafficConditions;
  lastUpdated: string;
}

interface TrafficConditions {
  averageSpeed: number;
  congestionLevel: string;
  vehicleCount: number;
  travelTime: number;
  incidents: Incident[];
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server-side error occurred

### Error Response Examples

**District Not Found:**
```json
{
  "error": "District not found"
}
```

**No State Available:**
```json
{
  "error": "No state available"
}
```

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
// Get complete state
async function getCompleteState() {
  try {
    const response = await fetch('http://localhost:3000/api/state');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching state:', error);
    throw error;
  }
}

// Get specific district
async function getDistrict(districtId) {
  const response = await fetch(`http://localhost:3000/api/state/districts/${districtId}`);
  return response.json();
}

// Get sensors
async function getSensors() {
  const response = await fetch('http://localhost:3000/api/state/sensors');
  return response.json();
}
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useCityState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchState() {
      try {
        const response = await fetch('http://localhost:3000/api/state');
        const data = await response.json();
        setState(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchState();
    const interval = setInterval(fetchState, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { state, loading, error };
}
```

### Python Example

```python
import requests

BASE_URL = "http://localhost:3000/api"

def get_complete_state():
    """Get the complete city state"""
    response = requests.get(f"{BASE_URL}/state")
    response.raise_for_status()
    return response.json()

def get_district(district_id):
    """Get a specific district"""
    response = requests.get(f"{BASE_URL}/state/districts/{district_id}")
    response.raise_for_status()
    return response.json()

def get_sensors():
    """Get all sensors"""
    response = requests.get(f"{BASE_URL}/state/sensors")
    response.raise_for_status()
    return response.json()

# Usage
try:
    state = get_complete_state()
    print(f"City: {state['city']['name']}")
    print(f"Districts: {len(state['city']['districts'])}")
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL Examples

```bash
# Health check
curl http://localhost:3000/api/health

# Get complete state
curl http://localhost:3000/api/state

# Get specific district
curl http://localhost:3000/api/state/districts/district-1

# Get city graph
curl http://localhost:3000/api/state/graph

# Get all sensors
curl http://localhost:3000/api/state/sensors

# Get public transport
curl http://localhost:3000/api/state/public-transport

# Get emergency services
curl http://localhost:3000/api/state/emergency-services

# Get latest snapshot
curl http://localhost:3000/api/snapshots/latest
```

---

## WebSocket Alternative

For real-time updates, consider using the WebSocket endpoint instead of polling:

**WebSocket URL:** `ws://localhost:3000`

**Connection Example:**
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('State update:', update);
};
```

---
