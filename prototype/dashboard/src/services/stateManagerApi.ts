import { config } from '../config';
import type { CityState, District, DistrictQueryParams } from '../types';

const BASE_URL = config.stateManagerUrl;

export class StateManagerApi {
  /**
   * Fetch the full city state
   */
  static async getFullState(): Promise<CityState> {
    const response = await fetch(`${BASE_URL}/state`);
    if (!response.ok) {
      throw new Error(`Failed to fetch state: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch a specific district by ID
   */
  static async getDistrict(
    id: string,
    params?: DistrictQueryParams
  ): Promise<District> {
    const queryParams = new URLSearchParams();
    if (params?.includeSensors !== undefined) {
      queryParams.append('includeSensors', String(params.includeSensors));
    }
    if (params?.includeBuildings !== undefined) {
      queryParams.append('includeBuildings', String(params.includeBuildings));
    }
    if (params?.includeTransport !== undefined) {
      queryParams.append('includeTransport', String(params.includeTransport));
    }

    const url = `${BASE_URL}/state/districts/${id}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch district: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch all districts (without detailed data)
   */
  static async getDistricts(): Promise<District[]> {
    const response = await fetch(`${BASE_URL}/state/districts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch districts: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Health check
   */
  static async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get the latest snapshot
   */
  static async getLatestSnapshot(): Promise<CityState> {
    const response = await fetch(`${BASE_URL}/snapshots/latest`);
    if (!response.ok) {
      throw new Error(`Failed to fetch latest snapshot: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get a specific snapshot by ID
   */
  static async getSnapshot(id: string): Promise<CityState> {
    const response = await fetch(`${BASE_URL}/snapshots/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
    }
    return response.json();
  }
}
