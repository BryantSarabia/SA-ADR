# Notification Manager

> Notification service for L'Aquila Digital Twin - Consumes notifications from Kafka and exposes REST API for querying.

## Overview

The Notification Manager is a microservice that:
- **Consumes** notification messages from a Kafka topic
- **Stores** notifications in MongoDB with full metadata
- **Exposes** a REST API for querying notifications with advanced filtering

---

## Architecture

```
┌─────────────────┐
│  City Systems   │
│  (Producers)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kafka Topic    │
│ city.notifications
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│ Kafka Consumer  │──────▶│    MongoDB      │
└─────────────────┘       └─────────────────┘
         │
         ▼
┌─────────────────┐
│   REST API      │
│ (Express.js)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    Clients      │
└─────────────────┘
```

---

## Features

### Kafka Consumer
- ✅ Automatic consumption from configurable Kafka topic
- ✅ **Zod schema validation** for incoming messages
- ✅ Automatic storage in MongoDB
- ✅ **Winston logging** with structured logs
- ✅ Consumer group support for horizontal scaling

### REST API
- ✅ Query notifications with multiple filters
- ✅ **Zod validation** for query parameters
- ✅ Filter by severity, source, and time range
- ✅ Pagination support (limit/offset)
- ✅ Sorting by timestamp, creation time, or severity
- ✅ Individual notification lookup by ID
- ✅ Health check endpoint

### Data Storage
- ✅ MongoDB with Mongoose ODM
- ✅ Optimized indexes for common queries
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Schema validation

### Validation & Logging
- ✅ **Zod** for type-safe runtime validation
- ✅ **Winston** for structured logging with multiple transports
- ✅ File logging (error.log, combined.log)
- ✅ Colorized console output for development

---

## Quick Start

### Prerequisites

- Node.js 20+ 
- MongoDB 7+
- Kafka 3+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd prototype/notification-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build TypeScript:**
   ```bash
   npm run build
   ```

5. **Start the service:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev:watch
   ```

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# API Server
API_PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/notifications

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-manager
KAFKA_GROUP_ID=notification-manager-group
KAFKA_NOTIFICATIONS_TOPIC=city.notifications

# Logging (Winston)
LOG_LEVEL=info
DEBUG=false
```

### Configuration Details

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_PORT` | HTTP server port | `3001` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/notifications` | Yes |
| `KAFKA_BROKERS` | Comma-separated Kafka brokers | `localhost:9092` | Yes |
| `KAFKA_CLIENT_ID` | Kafka client identifier | `notification-manager` | No |
| `KAFKA_GROUP_ID` | Kafka consumer group | `notification-manager-group` | No |
| `KAFKA_NOTIFICATIONS_TOPIC` | Kafka topic to consume | `city.notifications` | No |
| `LOG_LEVEL` | Winston log level (error, warn, info, debug) | `info` | No |
| `DEBUG` | Backward compatibility flag | `false` | No |

---

## Usage

### API Endpoints

**Base URL:** `http://localhost:3001/api`

#### Health Check
```bash
GET /health
```

#### Get Notifications
```bash
GET /notifications?severity=critical&limit=50
```

#### Get Notification by ID
```bash
GET /notifications/:id
```

### Query Examples

**Get all critical notifications:**
```bash
curl "http://localhost:3001/api/notifications?severity=critical"
```

**Filter by multiple severities:**
```bash
curl "http://localhost:3001/api/notifications?severity=warning,critical"
```

**Filter by source:**
```bash
curl "http://localhost:3001/api/notifications?source=sensor-network"
```

**Filter by time range:**
```bash
curl "http://localhost:3001/api/notifications?timestampFrom=2024-12-01T00:00:00Z&timestampTo=2024-12-08T23:59:59Z"
```

**Paginated query:**
```bash
curl "http://localhost:3001/api/notifications?limit=100&offset=0"
```

**Complex filter:**
```bash
curl "http://localhost:3001/api/notifications?severity=critical&source=emergency-system&timestampFrom=2024-12-08T00:00:00Z&limit=50&sortOrder=desc"
```

---

## Kafka Integration

### Message Format

Publish notifications to Kafka with this JSON structure:

```json
{
  "message": "High traffic congestion detected",
  "severity": "warning",
  "source": "traffic-monitoring",
  "timestamp": "2024-12-08T10:15:30.500Z"
}
```

### Severity Levels

- `info` - Informational messages
- `warning` - Warning messages requiring attention
- `error` - Error conditions
- `critical` - Critical issues requiring immediate action

### Example Producer (Node.js)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function sendNotification(notification) {
  await producer.connect();
  await producer.send({
    topic: 'city.notifications',
    messages: [{
      value: JSON.stringify({
        message: notification.message,
        severity: notification.severity,
        source: notification.source,
        timestamp: new Date().toISOString()
      })
    }]
  });
  await producer.disconnect();
}
```

---

## Docker Deployment

### Build Docker Image

```bash
# Build TypeScript first
npm run build

# Build Docker image
docker build -t notification-manager:latest .
```

### Run with Docker

```bash
docker run -d \
  --name notification-manager \
  -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongo:27017/notifications \
  -e KAFKA_BROKERS=kafka:9092 \
  notification-manager:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  notification-manager:
    build: .
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/notifications
      - KAFKA_BROKERS=kafka:9092
      - KAFKA_NOTIFICATIONS_TOPIC=city.notifications
    depends_on:
      - mongodb
      - kafka

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  kafka:
    image: confluentinc/cp-kafka:latest
    # Kafka configuration...

volumes:
  mongodb_data:
```

---

## Development

### Scripts

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm start

# Start development server
npm run dev

# Start with auto-reload
npm run dev:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
notification-manager/
├── src/
│   ├── api/              # Express API routes and server
│   │   ├── routes.ts     # API route definitions
│   │   └── server.ts     # Express server setup
│   ├── kafka/            # Kafka consumer
│   │   └── consumer.ts   # Kafka message consumer
│   ├── models/           # Mongoose models
│   │   └── notification.model.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── logger.ts
│   └── index.ts          # Application entry point
├── docs/                 # Documentation
│   ├── api/              # API documentation
│   │   ├── API_DOCUMENTATION.md
│   │   └── openapi.yaml
│   └── kafka/            # Kafka documentation
│       └── KAFKA_CONSUMER.md
├── dist/                 # Compiled JavaScript (generated)
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### API Documentation
- **[API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete REST API reference
- **[OpenAPI Specification](docs/api/openapi.yaml)** - Swagger/OpenAPI 3.0 spec

### Kafka Documentation
- **[Kafka Consumer](docs/kafka/KAFKA_CONSUMER.md)** - Kafka integration guide

---

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T10:30:00.000Z",
  "mongodb": "connected"
}
```

### Logs

The application logs all important events:

```
[2024-12-08T10:30:00.000Z] [INFO] Starting Notification Manager...
[2024-12-08T10:30:01.000Z] [INFO] Connected to MongoDB
[2024-12-08T10:30:02.000Z] [INFO] Kafka consumer connected
[2024-12-08T10:30:02.000Z] [INFO] Subscribed to topic: city.notifications
[2024-12-08T10:30:02.000Z] [INFO] API server listening on port 3001
[2024-12-08T10:30:02.000Z] [INFO] Notification Manager started successfully
```

Enable debug logging:
```bash
DEBUG=true npm start
```

---

## Performance

### Throughput
- **Kafka Consumption:** 1000+ messages/second
- **API Response Time:** 50-200ms (typical)
- **MongoDB Write:** < 50ms per notification

### Scalability

**Horizontal Scaling:**
- Run multiple consumer instances in the same consumer group
- Kafka automatically distributes messages across instances
- Each instance can handle API requests independently

**Recommended Setup:**
```
3 Kafka partitions → 3 consumer instances
API load balancer → N API server instances
```

---

## Troubleshooting

### Consumer Not Receiving Messages

**Check Kafka connection:**
```bash
nc -zv localhost 9092
```

**Verify topic exists:**
```bash
kafka-topics --list --bootstrap-server localhost:9092
```

**Check consumer group:**
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group notification-manager-group
```

### MongoDB Connection Failed

**Check MongoDB is running:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

**Verify connection string:**
```bash
echo $MONGODB_URI
```

### API Not Responding

**Check if server is running:**
```bash
curl http://localhost:3001/api/health
```

**Check logs:**
```bash
npm start
# Look for errors in console output
```

---

## Security

### Production Recommendations

1. **Enable Authentication:**
   - Add JWT or API key authentication
   - Restrict API access to authorized clients

2. **Secure Kafka:**
   - Use SASL authentication
   - Enable SSL/TLS encryption

3. **Secure MongoDB:**
   - Enable authentication
   - Use encrypted connections
   - Restrict network access

4. **HTTPS:**
   - Use TLS certificates
   - Disable HTTP in production

5. **Rate Limiting:**
   - Implement API rate limiting
   - Prevent DoS attacks

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues or questions:
- Check the [API Documentation](docs/api/API_DOCUMENTATION.md)
- Check the [Kafka Documentation](docs/kafka/KAFKA_CONSUMER.md)
- Review application logs
- Open an issue on GitHub

---

**Last Updated:** December 8, 2024
