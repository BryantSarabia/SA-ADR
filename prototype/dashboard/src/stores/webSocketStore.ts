import { create } from 'zustand';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketStore {
  // State
  connectionState: ConnectionState;
  error: Error | null;
  reconnectAttempts: number;
  
  // Actions
  setConnectionState: (state: ConnectionState, error?: Error) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  // Initial state
  connectionState: 'disconnected',
  error: null,
  reconnectAttempts: 0,

  // Set connection state
  setConnectionState: (connectionState: ConnectionState, error?: Error) => {
    set({ 
      connectionState,
      error: error || null,
    });
  },

  // Increment reconnect attempts
  incrementReconnectAttempts: () => {
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    }));
  },

  // Reset reconnect attempts
  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },
}));
