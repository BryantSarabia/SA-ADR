import { config } from '../config';
import type { Notification, NotificationQueryParams, NotificationsResponse } from '../types';

const BASE_URL = config.notificationManagerUrl;

export class NotificationManagerApi {
  /**
   * Fetch notifications with optional filters
   */
  static async getNotifications(
    params?: NotificationQueryParams
  ): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.timestampFrom) {
      queryParams.append('timestampFrom', params.timestampFrom);
    }
    if (params?.timestampTo) {
      queryParams.append('timestampTo', params.timestampTo);
    }
    if (params?.severity) {
      queryParams.append('severity', params.severity);
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    if (params?.districtId) {
      queryParams.append('districtId', params.districtId);
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.page !== undefined) {
      queryParams.append('page', String(params.page));
    }
    if (params?.read !== undefined) {
      queryParams.append('read', String(params.read));
    }

    const url = `${BASE_URL}/notifications${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch a specific notification by ID
   */
  static async getNotification(id: string): Promise<Notification> {
    const response = await fetch(`${BASE_URL}/notifications/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notification: ${response.statusText}`);
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
   * Utility: Get notifications from the last N seconds
   */
  static async getRecentNotifications(
    lastSeconds: number = 5,
    additionalParams?: Omit<NotificationQueryParams, 'timestampFrom'>
  ): Promise<NotificationsResponse> {
    const timestampFrom = new Date(Date.now() - lastSeconds * 1000).toISOString();
    return this.getNotifications({
      ...additionalParams,
      timestampFrom,
    });
  }
}
