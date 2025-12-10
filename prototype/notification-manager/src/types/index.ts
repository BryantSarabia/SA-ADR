/**
 * Notification severity levels
 */
export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Notification source types
 */
export type NotificationSource = string;

/**
 * Incoming notification message from Kafka
 */
export interface IncomingNotificationMessage {
  message: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  timestamp: string; // ISO 8601 format
}

/**
 * Stored notification in MongoDB
 */
export interface Notification {
  _id?: string;
  message: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Query filters for notification retrieval
 */
export interface NotificationFilters {
  severity?: NotificationSeverity | NotificationSeverity[];
  source?: NotificationSource | NotificationSource[];
  timestampFrom?: Date;
  timestampTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'createdAt' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * API response for notification list
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * API response for single notification
 */
export interface NotificationResponse {
  notification: Notification;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: any;
}
