import type { Delta } from 'jsondiffpatch';
import * as jsondiffpatch from 'jsondiffpatch';
import { config } from '../config';
import type { CityState, StateUpdate, WebSocketMessage } from '../types';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (message: WebSocketMessage) => void;
type StateUpdateHandler = (update: StateUpdate) => void;
type ConnectionStateHandler = (state: ConnectionState, error?: Error) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly url: string;
  private readonly diffPatcher = jsondiffpatch.create();
  
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateUpdateHandlers: Set<StateUpdateHandler> = new Set();
  private connectionStateHandlers: Set<ConnectionStateHandler> = new Set();
  
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 3000; // 3 seconds
  
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly pingIntervalMs = 30000; // 30 seconds

  constructor(url?: string) {
    this.url = url || config.stateManagerWsUrl;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.setConnectionState('connecting');
    console.log(`Connecting to WebSocket: ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setConnectionState('error', error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    this.clearPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }

  /**
   * Subscribe to raw WebSocket messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to state updates (incremental patches)
   */
  onStateUpdate(handler: StateUpdateHandler): () => void {
    this.stateUpdateHandlers.add(handler);
    return () => this.stateUpdateHandlers.delete(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.add(handler);
    // Immediately call with current state
    handler(this.connectionState);
    return () => this.connectionStateHandlers.delete(handler);
  }

  /**
   * Apply a jsondiffpatch patch to the current state
   */
  applyPatch(currentState: CityState, patch: unknown): CityState {
    return this.diffPatcher.patch(JSON.parse(JSON.stringify(currentState)), patch as Delta) as CityState;
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Notify all message handlers
        this.messageHandlers.forEach(handler => handler(message));

        // Handle different message types
        if (message.type === 'incremental_update' && message.patch) {
          const update: StateUpdate = {
            timestamp: message.timestamp || new Date().toISOString(),
            patch: message.patch,
          };
          this.stateUpdateHandlers.forEach(handler => handler(update));
        } else if (message.type === 'error') {
          console.error('WebSocket error message:', message.error);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.setConnectionState('error', new Error('WebSocket error'));
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason}`);
      this.clearPingInterval();
      this.setConnectionState('disconnected');
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setConnectionState(state: ConnectionState, error?: Error): void {
    this.connectionState = state;
    this.connectionStateHandlers.forEach(handler => handler(state, error));
  }

  private startPingInterval(): void {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.pingIntervalMs);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
