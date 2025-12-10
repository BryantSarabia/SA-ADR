# Notification Manager API Documentation

## Overview

The Notification Manager API provides RESTful endpoints to query notification data stored in MongoDB. Notifications are consumed from Kafka and made available through this API with advanced filtering capabilities.

**Base URL:** `http://localhost:3001/api`

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Get Notifications](#get-notifications)
  - [Get Notification by ID](#get-notification-by-id)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Filtering and Pagination](#filtering-and-pagination)
- [Integration Examples](#integration-examples)

---

## Authentication

Currently, the API does not require authentication. In production environments, implement appropriate authentication mechanisms (e.g., API keys, JWT tokens, OAuth 2.0).

---

## Endpoints

### Health Check

Check if the API server and MongoDB are operational.

**Endpoint:** `GET /api/health`

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T10:30:00.000Z",
  "mongodb": "connected"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-12-08T10:30:00.000Z",
  "error": "Connection timeout"
}
```

**Status Codes:**
- `200 OK`: System is healthy
- `503 Service Unavailable`: System is unhealthy

**Example:**
```bash
curl http://localhost:3001/api/health
```

---

### Get Notifications

Retrieve notifications with optional filtering, sorting, and pagination.

**Endpoint:** `GET /api/notifications`

**Query Parameters:**

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `severity` | string or string[] | Filter by severity level(s) | - | `warning` or `warning,critical` |
| `source` | string or string[] | Filter by source(s) | - | `sensor-network` or `traffic,emergency` |
| `timestampFrom` | ISO 8601 string | Start of time range | - | `2024-12-01T00:00:00Z` |
| `timestampTo` | ISO 8601 string | End of time range | - | `2024-12-08T23:59:59Z` |
| `limit` | number | Maximum results to return | 50 | `100` (max: 1000) |
| `offset` | number | Number of results to skip | 0 | `50` |
| `sortBy` | string | Field to sort by | `timestamp` | `timestamp`, `createdAt`, `severity` |
| `sortOrder` | string | Sort direction | `desc` | `asc` or `desc` |

**Response:**
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "message": "High traffic congestion detected",
      "severity": "warning",
      "source": "traffic-monitoring",
      "timestamp": "2024-12-08T10:15:30.500Z",
      "createdAt": "2024-12-08T10:15:31.000Z",
      "updatedAt": "2024-12-08T10:15:31.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:**
- `200 OK`: Notifications retrieved successfully
- `500 Internal Server Error`: Server error

**Examples:**

**Get all notifications (default pagination):**
```bash
curl http://localhost:3001/api/notifications
```

**Filter by severity:**
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

**Combined filters with pagination:**
```bash
curl "http://localhost:3001/api/notifications?severity=critical&source=emergency-system&limit=20&offset=0&sortOrder=desc"
```

---

### Get Notification by ID

Retrieve a specific notification by its MongoDB ID.

**Endpoint:** `GET /api/notifications/:id`

**Path Parameters:**
- `id` (required): MongoDB ObjectId (24-character hex string)

**Response (Success):**
```json
{
  "notification": {
    "_id": "507f1f77bcf86cd799439011",
    "message": "Seismic activity detected - magnitude 4.2",
    "severity": "critical",
    "source": "seismic-monitoring",
    "timestamp": "2024-12-08T10:25:45.123Z",
    "createdAt": "2024-12-08T10:25:46.000Z",
    "updatedAt": "2024-12-08T10:25:46.000Z"
  }
}
```

**Response (Not Found):**
```json
{
  "error": "Notification not found"
}
```

**Response (Invalid ID):**
```json
{
  "error": "Invalid notification ID format"
}
```

**Status Codes:**
- `200 OK`: Notification found
- `400 Bad Request`: Invalid ID format
- `404 Not Found`: Notification not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3001/api/notifications/507f1f77bcf86cd799439011
```

---

## Data Models

### Notification

```typescript
{
  _id: string;                    // MongoDB ObjectId
  message: string;                // Notification message (max 5000 chars)
  severity: "info" | "warning" | "error" | "critical";
  source: string;                 // Source system identifier
  timestamp: Date;                // When notification was generated (ISO 8601)
  createdAt: Date;                // When record was created in DB
  updatedAt: Date;                // When record was last updated
}
```

### Severity Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `info` | Informational | System status updates, routine events |
| `warning` | Warning | Issues requiring attention but not critical |
| `error` | Error | System errors, failed operations |
| `critical` | Critical | Urgent issues requiring immediate action |

### Common Sources

- `sensor-network` - IoT sensor system
- `traffic-monitoring` - Traffic management system
- `building-management` - Building automation systems
- `emergency-system` - Emergency services
- `seismic-monitoring` - Earthquake detection
- `weather-service` - Weather monitoring
- `system-admin` - Administrative notifications

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message description",
  "details": "Optional detailed error information"
}
```

### Common Errors

**400 Bad Request:**
```json
{
  "error": "Invalid notification ID format"
}
```

**404 Not Found:**
```json
{
  "error": "Notification not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve notifications",
  "details": "Database connection timeout"
}
```

---

## Filtering and Pagination

### Multiple Value Filters

Use comma-separated values for multiple filter values:

```bash
# Multiple severities
?severity=warning,error,critical

# Multiple sources
?source=sensor-network,traffic-monitoring
```

### Time Range Filtering

Both `timestampFrom` and `timestampTo` are inclusive:

```bash
# All notifications from December 1-8, 2024
?timestampFrom=2024-12-01T00:00:00Z&timestampTo=2024-12-08T23:59:59Z

# Notifications after a specific time
?timestampFrom=2024-12-08T10:00:00Z

# Notifications before a specific time
?timestampTo=2024-12-08T23:59:59Z
```

### Pagination

Use `limit` and `offset` for pagination:

```bash
# First page (50 items)
?limit=50&offset=0

# Second page (50 items)
?limit=50&offset=50

# Third page (50 items)
?limit=50&offset=100
```

**Maximum limit:** 1000 items per request

### Sorting

Sort by different fields:

```bash
# By timestamp (newest first) - default
?sortBy=timestamp&sortOrder=desc

# By timestamp (oldest first)
?sortBy=timestamp&sortOrder=asc

# By creation time
?sortBy=createdAt&sortOrder=desc

# By severity (critical first when desc)
?sortBy=severity&sortOrder=desc
```

---

## Integration Examples

### JavaScript (Fetch API)

**Get all critical notifications:**
```javascript
async function getCriticalNotifications() {
  const response = await fetch(
    'http://localhost:3001/api/notifications?severity=critical&sortOrder=desc'
  );
  const data = await response.json();
  return data.notifications;
}
```

**Get notification by ID:**
```javascript
async function getNotification(id) {
  try {
    const response = await fetch(`http://localhost:3001/api/notifications/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
}
```

**Paginated query:**
```javascript
async function getNotificationsPaginated(page = 0, pageSize = 50) {
  const offset = page * pageSize;
  const response = await fetch(
    `http://localhost:3001/api/notifications?limit=${pageSize}&offset=${offset}`
  );
  return response.json();
}
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function useNotifications(filters = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const response = await fetch(
          `http://localhost:3001/api/notifications?${params}`
        );
        const data = await response.json();
        setNotifications(data.notifications);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [JSON.stringify(filters)]);

  return { notifications, loading, error, total };
}

// Usage
function NotificationList() {
  const { notifications, loading, error } = useNotifications({
    severity: 'critical',
    limit: 20
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {notifications.map(n => (
        <li key={n._id}>{n.message}</li>
      ))}
    </ul>
  );
}
```