import { create } from 'zustand';
import { StateManagerApi } from '../services/stateManagerApi';
import { webSocketService } from '../services/webSocketService';
import type { CityState } from '../types';

interface CityStateStore {
  // State
  cityState: CityState | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: string | null;
  
  // Actions
  loadInitialState: () => Promise<void>;
  applyIncrementalUpdate: (patch: unknown) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

export const useCityStateStore = create<CityStateStore>((set, get) => ({
  // Initial state
  cityState: null,
  isLoading: false,
  error: null,
  lastUpdate: null,

  // Load the initial full state from the API
  loadInitialState: async () => {
    set({ isLoading: true, error: null });
    try {
      const cityState = await StateManagerApi.getFullState();
      set({
        cityState,
        isLoading: false,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load initial state:', error);
      set({
        error: error as Error,
        isLoading: false,
      });
    }
  },

  // Apply an incremental update (jsondiffpatch patch) to the current state
  applyIncrementalUpdate: (patch: unknown) => {
    const { cityState } = get();
    if (!cityState) {
      console.warn('Cannot apply patch: no current state');
      return;
    }

    try {
      const updatedState = webSocketService.applyPatch(cityState, patch);
      set({
        cityState: updatedState,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to apply incremental update:', error);
      set({ error: error as Error });
    }
  },

  // Set an error
  setError: (error: Error | null) => {
    set({ error });
  },

  // Reset the store
  reset: () => {
    set({
      cityState: null,
      isLoading: false,
      error: null,
      lastUpdate: null,
    });
  },
}));
