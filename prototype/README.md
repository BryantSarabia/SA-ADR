# Digital Twin State Manager - Setup Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Ports available: 3000 (API), 3001 (WebSocket), 6379 (Redis), 27017 (MongoDB), 9092/9093 (Kafka)

### Start All Services

```powershell
# Navigate to prototype directory
cd prototype

# Build and start all services
docker-compose up --build
```

This will start:
- **Redis** (port 6379) - In-memory state store
- **MongoDB** (port 27017) - Historical snapshots
- **Zookeeper** (port 2181) - Kafka coordination
- **Kafka** (ports 9092/9093) - Message broker
- **State Manager** (ports 3000/3001) - Main service
- **Data Producer** - Mock data generator

### Access the Services

**API Endpoints:**
- Health: http://localhost:3000/health
- Complete State: http://localhost:3000/state
- Districts: http://localhost:3000/state/districts
- Specific District: http://localhost:3000/state/districts/DIST-001

**WebSocket:**
- Connect to: ws://localhost:3001

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f state-manager
docker-compose logs -f data-producer
```

### Stop Services

```powershell
docker-compose down

# Remove volumes (clean state)
docker-compose down -v
```

## Local Development

### State Manager Service

```powershell
cd state-manager

# Install dependencies
npm install

# Build
npm run build

# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### Data Producer

```powershell
cd producer

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## Testing WebSocket Connection

Create a simple HTML client or use this Node.js example:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('initial-state', (state) => {
  console.log('Initial state received:', state);
});

socket.on('state-update', (delta) => {
  console.log('Incremental update:', delta);
});
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```env
REDIS_HOST=redis
REDIS_PORT=6379
MONGODB_URI=mongodb://mongodb:27017
KAFKA_BROKERS=kafka:9092
API_PORT=3000
WEBSOCKET_PORT=3001
LOG_LEVEL=info
```

## Kubernetes Migration Notes

The docker-compose configuration is designed with Kubernetes in mind:

- **Health checks**: All services have health check endpoints
- **Service dependencies**: Properly configured with `depends_on`
- **Environment variables**: Externalized configuration
- **Non-root containers**: Services run as non-root users
- **Named networks**: Easy to translate to Kubernetes Services

### Convert to Kubernetes

Key mappings:
- `docker-compose services` → `Kubernetes Deployments`
- `ports` → `Kubernetes Services`
- `volumes` → `PersistentVolumeClaims`
- `depends_on` → `initContainers` or readiness probes
- `environment` → `ConfigMaps` and `Secrets`

## Architecture

```
┌─────────────────┐
│  Data Producer  │ (Mock Kafka Messages)
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Kafka  │ (Auto-create topics, 3 partitions)
    └───┬────┘
        │
        ▼
┌───────────────────┐
│  State Manager    │
│  ┌─────────────┐  │
│  │   Kafka     │  │ ← Consumes messages
│  │  Consumer   │  │
│  └──────┬──────┘  │
│         ▼         │
│  ┌─────────────┐  │
│  │   Redis     │◄─┤ ← In-memory state (district-sharded)
│  │   Manager   │  │
│  └──────┬──────┘  │
│         │         │
│         ├─────────┤
│         ▼         ▼
│  ┌──────────┐ ┌──────────┐
│  │   API    │ │ WebSocket│
│  │  Server  │ │ Handler  │
│  └────┬─────┘ └─────┬────┘
└───────┼─────────────┼─────┘
        │             │
        ▼             ▼
   REST Clients   WS Clients
   (GET /state)   (Real-time updates)
```

## Troubleshooting

### Services not starting
Check logs: `docker-compose logs -f`

### Kafka connection issues
Wait for all health checks to pass (30-60 seconds on first start)

### Empty state
This is expected initially. State builds from Kafka messages produced by data-producer.

### Port conflicts
Check if ports 3000, 3001, 6379, 9092, 27017 are available.
