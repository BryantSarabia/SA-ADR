# L'Aquila Digital Twin Dashboard

A real-time visualization dashboard for the L'Aquila Digital Twin system, built with React, TypeScript, and Leaflet.

## Features

- **Real-time Map Visualization**: Interactive Leaflet map displaying city state
- **Live Updates**: WebSocket connection for incremental state updates using jsondiffpatch
- **Notification System**: Polls notification service every 5 seconds with unread badge
- **Sensor Monitoring**: Visualize sensors with status-based color coding
- **Transport Tracking**: Real-time transport unit positions
- **Connection Status**: Visual indicator for WebSocket connection state

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Leaflet** - Interactive maps
- **Zustand** - State management
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **jsondiffpatch** - Incremental state updates
- **Lucide React** - Icons

## Prerequisites

- Node.js 18+ and npm
- Running State Manager service (default: http://localhost:3001)
- Running Notification Manager service (default: http://localhost:3003)

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (optional)
# Edit .env to point to your service URLs
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# State Manager API
VITE_STATE_MANAGER_URL=http://localhost:3001
VITE_STATE_MANAGER_WS_URL=ws://localhost:3001

# Notification Manager API
VITE_NOTIFICATION_MANAGER_URL=http://localhost:3003
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components (Header, Layout)
│   ├── map/            # Map-related components
│   └── notifications/   # Notification UI components
├── config/             # Configuration
├── pages/              # Page components
├── services/           # API clients and WebSocket service
├── stores/             # Zustand stores
└── types/              # TypeScript type definitions
```

## Architecture

### State Management

The dashboard uses Zustand for state management with three main stores:

1. **City State Store** - Holds the current digital twin state and applies incremental patches
2. **Notification Store** - Manages notifications and unread count
3. **WebSocket Store** - Tracks WebSocket connection state

### Data Flow

1. **Initial Load**: Fetches full city state from State Manager API on mount
2. **WebSocket Updates**: Receives incremental patches and applies them using jsondiffpatch
3. **Notification Polling**: TanStack Query polls every 5 seconds for new notifications
4. **Map Rendering**: React Leaflet renders markers based on current state

### Map Features

- **Marker Status Colors**:
  - Green: Active
  - Gray: Inactive
  - Red: Error
  - Orange: Degraded

- **Sensor Markers**: Show sensor type, status, and live data
- **Transport Markers**: Display vehicle info, route, and speed

## API Integration

### State Manager API

- `GET /state` - Fetch full city state
- `GET /state/districts/:id` - Get specific district
- `WS /` - WebSocket for incremental updates

### Notification Manager API

- `GET /notifications` - Fetch notifications with filters
- `GET /notifications/:id` - Get specific notification

## Troubleshooting

### WebSocket Connection Issues

- Check State Manager is running and WebSocket endpoint is accessible
- Verify `VITE_STATE_MANAGER_WS_URL` in `.env`

### Map Not Displaying

- Ensure Leaflet CSS is imported in `index.css`
- Verify coordinates are valid

### Notifications Not Updating

- Confirm Notification Manager is running
- Check `VITE_NOTIFICATION_MANAGER_URL` in `.env`
