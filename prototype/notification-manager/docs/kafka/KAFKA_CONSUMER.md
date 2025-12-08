# Kafka Consumer Documentation

## Overview

The Notification Manager consumes notification messages from a Kafka topic and stores them in MongoDB. This document describes the Kafka integration, message format, and processing logic.

---

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `KAFKA_BROKERS` | Comma-separated list of Kafka broker addresses | `localhost:9092` | Yes |
| `KAFKA_CLIENT_ID` | Client identifier for Kafka connection | `notification-manager` | No |
| `KAFKA_GROUP_ID` | Consumer group ID for message consumption | `notification-manager-group` | No |
| `KAFKA_NOTIFICATIONS_TOPIC` | Topic name to subscribe to | `city.notifications` | No |

### Example Configuration

```bash
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
KAFKA_CLIENT_ID=notification-manager
KAFKA_GROUP_ID=notification-manager-group
KAFKA_NOTIFICATIONS_TOPIC=city.notifications
```

---

## Kafka Topic

### Topic Name

**Default:** `city.notifications`

This topic receives notification messages from various sources in the digital twin system.

### Topic Configuration Recommendations

```
Partitions: 3-6 (for parallel processing)
Replication Factor: 3 (for high availability)
Retention: 7 days (configurable based on requirements)
Compression: snappy or lz4
```

---

## Message Format

### Schema

The consumer expects JSON messages with the following structure:

```json
{
  "message": "string",
  "severity": "info" | "warning" | "error" | "critical",
  "source": "string",
  "timestamp": "ISO 8601 string"
}
```

### Field Specifications

#### `message` (string, required)
- **Description:** The notification message content
- **Constraints:** 
  - Must be a non-empty string
  - Maximum length: 5000 characters (enforced by MongoDB schema)
- **Example:** `"Temperature sensor T-42 detected abnormal reading"`

#### `severity` (enum, required)
- **Description:** Notification severity level
- **Allowed Values:**
  - `info`: Informational messages
  - `warning`: Warning messages requiring attention
  - `error`: Error conditions
  - `critical`: Critical issues requiring immediate action
- **Example:** `"critical"`

#### `source` (string, required)
- **Description:** Source system or component that generated the notification
- **Constraints:** Non-empty string, trimmed
- **Examples:**
  - `"sensor-network"`
  - `"traffic-monitoring"`
  - `"building-management"`
  - `"emergency-system"`

#### `timestamp` (string, required)
- **Description:** When the notification was generated
- **Format:** ISO 8601 date-time string
- **Examples:**
  - `"2024-12-08T10:30:00.000Z"`
  - `"2024-12-08T10:30:00+01:00"`

---

## Message Examples

### Info Notification

```json
{
  "message": "System maintenance scheduled for 2024-12-10 at 02:00 UTC",
  "severity": "info",
  "source": "system-admin",
  "timestamp": "2024-12-08T10:00:00.000Z"
}
```

### Warning Notification

```json
{
  "message": "High traffic congestion detected on Via XX Settembre",
  "severity": "warning",
  "source": "traffic-monitoring",
  "timestamp": "2024-12-08T10:15:30.500Z"
}
```

### Error Notification

```json
{
  "message": "Sensor S-123 failed to report data for 15 minutes",
  "severity": "error",
  "source": "sensor-network",
  "timestamp": "2024-12-08T10:20:00.000Z"
}
```

### Critical Notification

```json
{
  "message": "Seismic activity detected - magnitude 4.2",
  "severity": "critical",
  "source": "seismic-monitoring",
  "timestamp": "2024-12-08T10:25:45.123Z"
}
```

---

## Consumer Behavior

### Connection

The consumer connects to Kafka on application startup and subscribes to the configured topic.

**Connection Flow:**
1. Connect to Kafka brokers
2. Join consumer group
3. Subscribe to topic
4. Start consuming from latest offset (not from beginning)

### Message Processing

For each consumed message:

1. **Parse JSON:** Convert message value to JSON object
2. **Validate Schema:** Check for required fields and correct types
3. **Validate Severity:** Ensure severity is one of the allowed values
4. **Validate Timestamp:** Parse and verify ISO 8601 format
5. **Store in MongoDB:** Create notification document
6. **Log Success:** Log notification ID and metadata

### Error Handling

#### Invalid Messages

Invalid messages are logged and skipped. The consumer continues processing subsequent messages.

**Logged Information:**
- Message payload
- Validation error details
- Topic and partition

#### Database Errors

If MongoDB storage fails:
- Error is logged with full details
- Message is **not** committed (will be reprocessed)
- Consumer continues with next message

#### Connection Errors

If Kafka connection is lost:
- Consumer attempts automatic reconnection
- Application logs connection status
- Processing resumes when connection is restored

---

## Message Validation

### Validation Rules

```typescript
// Required fields
✓ message: typeof string
✓ severity: typeof string AND in ['info', 'warning', 'error', 'critical']
✓ source: typeof string
✓ timestamp: typeof string AND valid ISO 8601

// Additional checks
✓ Message is not empty
✓ Timestamp can be parsed to valid Date
✓ All fields are present (no undefined/null)
```

### Invalid Message Examples

**Missing Field:**
```json
{
  "message": "Test notification",
  "severity": "info"
  // Missing 'source' and 'timestamp' - REJECTED
}
```

**Invalid Severity:**
```json
{
  "message": "Test notification",
  "severity": "high",  // Invalid - must be info/warning/error/critical
  "source": "test",
  "timestamp": "2024-12-08T10:00:00.000Z"
}
```

**Invalid Timestamp:**
```json
{
  "message": "Test notification",
  "severity": "info",
  "source": "test",
  "timestamp": "2024-12-08"  // Invalid - not full ISO 8601
}
```

---

## Performance Considerations

### Throughput

- **Target:** 1000+ messages/second
- **Actual:** Depends on MongoDB write performance
- **Optimization:** Batch processing can be implemented if needed

### Latency

- **Message Processing:** < 50ms per message (typical)
- **End-to-End:** < 200ms from Kafka publish to MongoDB storage

### Scalability

**Horizontal Scaling:**
- Multiple consumer instances can run in the same consumer group
- Messages are distributed across instances based on partition assignment
- Recommended: 1 consumer per partition for optimal throughput

**Partition Strategy:**
```
3 partitions → 3 consumer instances
6 partitions → 6 consumer instances
```

---

## Monitoring

### Key Metrics

- **Messages consumed/second**
- **Processing latency**
- **Error rate**
- **Consumer lag** (messages behind)
- **MongoDB write latency**

### Health Checks

The application logs:
- Consumer connection status
- Message processing success/failure
- MongoDB connection status

### Logging

**Log Levels:**
- `INFO`: Connection events, successful processing
- `WARN`: Invalid messages
- `ERROR`: Processing failures, connection errors
- `DEBUG`: Detailed message information (if `DEBUG=true`)

---

## Integration Guide

### Producing Notifications

To send notifications to the Notification Manager, publish messages to the configured Kafka topic:

**Node.js Example (KafkaJS):**

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function sendNotification() {
  await producer.connect();
  
  await producer.send({
    topic: 'city.notifications',
    messages: [{
      value: JSON.stringify({
        message: 'High temperature detected in building B-45',
        severity: 'warning',
        source: 'building-management',
        timestamp: new Date().toISOString()
      })
    }]
  });
  
  await producer.disconnect();
}
```

**Python Example (kafka-python):**

```python
from kafka import KafkaProducer
import json
from datetime import datetime

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

notification = {
    'message': 'High temperature detected in building B-45',
    'severity': 'warning',
    'source': 'building-management',
    'timestamp': datetime.utcnow().isoformat() + 'Z'
}

producer.send('city.notifications', notification)
producer.flush()
```

---

## Troubleshooting

### Consumer Not Receiving Messages

1. **Check Kafka connection:**
   ```bash
   # Test connectivity
   nc -zv kafka-broker 9092
   ```

2. **Verify topic exists:**
   ```bash
   kafka-topics --list --bootstrap-server localhost:9092
   ```

3. **Check consumer group:**
   ```bash
   kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group notification-manager-group
   ```

### Messages Being Rejected

Check application logs for validation errors:
```
[ERROR] Invalid notification message format
```

Ensure messages match the expected schema exactly.

### High Consumer Lag

**Causes:**
- MongoDB write performance bottleneck
- Insufficient consumer instances
- Network latency

**Solutions:**
- Add more consumer instances
- Optimize MongoDB indexes
- Increase partition count

---

## Security Considerations

### Kafka Authentication

For production deployments, configure SASL authentication:

```javascript
const kafka = new Kafka({
  clientId: 'notification-manager',
  brokers: ['kafka:9092'],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});
```

### Message Encryption

Consider encrypting sensitive notification content before publishing to Kafka.

---

**Last Updated:** December 8, 2024
