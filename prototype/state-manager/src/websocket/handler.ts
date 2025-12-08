import { Server as HttpServer } from 'http';
import * as jsondiffpatch from 'jsondiffpatch';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { RedisStateManager } from '../state/redis-manager';
import { City } from '../types';
import { logger } from '../utils/logger';

export class WebSocketHandler {
  private io: SocketIOServer;
  private redisManager: RedisStateManager;
  private diffPatcher: jsondiffpatch.DiffPatcher;
  private lastStates: Map<string, City> = new Map();
  // private updateBuffer: Map<string, any> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;
  private bufferInterval: number;

  constructor(httpServer: HttpServer, redisManager: RedisStateManager) {
    this.redisManager = redisManager;
    this.bufferInterval = parseInt(process.env.WS_UPDATE_BUFFER_MS || '100');

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Initialize jsondiffpatch
    this.diffPatcher = jsondiffpatch.create({
      objectHash: (obj: any) => {
        return obj.id || obj.sensorId || obj.districtId || obj.buildingId || obj.busId || obj.incidentId || JSON.stringify(obj);
      },
      arrays: {
        detectMove: true,
      },
    });

    this.setupConnectionHandlers();
    this.startUpdateBroadcaster();
  }

  /**
   * Normalize state by removing timestamp fields that change frequently
   * This prevents false positives in diff detection
   */
  private normalizeStateForDiff(state: City): any {
    const normalized = JSON.parse(JSON.stringify(state));
    
    // Remove top-level timestamp
    delete normalized.timestamp;
    delete normalized.metadata?.lastUpdated;
    
    // Remove timestamps from districts and their entities
    normalized.districts?.forEach((district: any) => {
      delete district.lastUpdated;
      
      district.sensors?.forEach((sensor: any) => {
        delete sensor.lastUpdated;
      });
      
      district.buildings?.forEach((building: any) => {
        delete building.lastUpdated;
      });
      
      district.weatherStations?.forEach((station: any) => {
        delete station.lastUpdated;
      });
    });
    
    // Remove timestamps from city graph edges
    normalized.cityGraph?.edges?.forEach((edge: any) => {
      delete edge.lastUpdated;
      delete edge.trafficConditions?.lastUpdated;
    });
    
    // Remove timestamps from public transport
    normalized.publicTransport?.buses?.forEach((bus: any) => {
      delete bus.lastUpdated;
    });
    
    normalized.publicTransport?.stations?.forEach((station: any) => {
      delete station.lastUpdated;
    });
    
    // Remove timestamps from emergency services
    normalized.emergencyServices?.incidents?.forEach((incident: any) => {
      delete incident.reportedAt;
      delete incident.lastUpdated;
    });
    
    normalized.emergencyServices?.units?.forEach((unit: any) => {
      delete unit.lastUpdated;
    });
    
    return normalized;
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on('connection', async (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      try {
        // Send initial full state
        const initialState = await this.redisManager.getCompleteState();
        socket.emit('initial-state', initialState);

        // Store last state for this client
        this.lastStates.set(socket.id, initialState);

        logger.info(`Sent initial state to client: ${socket.id}`);
      } catch (error) {
        logger.error('Error sending initial state:', error);
        socket.emit('error', { message: 'Failed to retrieve initial state' });
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
        this.lastStates.delete(socket.id);
      });

      // Handle client requests for specific district
      socket.on('subscribe-district', async (districtId: string) => {
        logger.info(`Client ${socket.id} subscribed to district ${districtId}`);
        socket.join(`district:${districtId}`);
      });

      socket.on('unsubscribe-district', (districtId: string) => {
        logger.info(`Client ${socket.id} unsubscribed from district ${districtId}`);
        socket.leave(`district:${districtId}`);
      });
    });
  }

  /**
   * Start the update broadcaster that sends incremental diffs
   */
  private startUpdateBroadcaster(): void {
    this.updateTimer = setInterval(async () => {
      try {
        await this.broadcastStateUpdates();
      } catch (error) {
        logger.error('Error broadcasting updates:', error);
      }
    }, this.bufferInterval);

    logger.info(`WebSocket update broadcaster started (interval: ${this.bufferInterval}ms)`);
  }

  /**
   * Broadcast state updates to all connected clients
   */
  private async broadcastStateUpdates(): Promise<void> {
    if (this.lastStates.size === 0) {
      return; // No connected clients
    }

    // Get current state
    const currentState = await this.redisManager.getCompleteState();

    // Send diffs to each connected client
    this.lastStates.forEach((lastState, socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      
      if (!socket) {
        this.lastStates.delete(socketId);
        return;
      }

      try {
        // Normalize states before diff to exclude timestamp fields
        const normalizedLast = this.normalizeStateForDiff(lastState);
        const normalizedCurrent = this.normalizeStateForDiff(currentState);
        
        // Calculate diff between normalized states
        const delta = this.diffPatcher.diff(normalizedLast, normalizedCurrent);

        if (delta) {
          // Send incremental update
          socket.emit('state-update', delta);
          logger.debug(`Sent incremental update to client ${socketId}`, {
            deltaSize: JSON.stringify(delta).length,
          });

          // Update last state for this client
          this.lastStates.set(socketId, JSON.parse(JSON.stringify(currentState)));
        }
      } catch (error) {
        logger.error(`Error calculating diff for client ${socketId}:`, error);
      }
    });
  }

  /**
   * Notify about specific district update
   */
  async notifyDistrictUpdate(districtId: string): Promise<void> {
    try {
      const district = await this.redisManager.getDistrictState(districtId);
      
      if (district) {
        this.io.to(`district:${districtId}`).emit('district-update', district);
        logger.debug(`Sent district update to subscribers: ${districtId}`);
      }
    } catch (error) {
      logger.error('Error notifying district update:', error);
    }
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.io.close();
    logger.info('WebSocket server stopped');
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }
}
