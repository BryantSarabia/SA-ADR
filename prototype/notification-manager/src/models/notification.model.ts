import mongoose, { Document, Schema } from 'mongoose';
import { Notification, NotificationSeverity } from '../types';

/**
 * Mongoose document interface for Notification
 */
export interface NotificationDocument extends Omit<Notification, '_id'>, Document {}

/**
 * Notification schema for MongoDB
 */
const notificationSchema = new Schema<NotificationDocument>(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(NotificationSeverity),
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'notifications',
  }
);

// Compound index for common queries
notificationSchema.index({ severity: 1, timestamp: -1 });
notificationSchema.index({ source: 1, timestamp: -1 });
notificationSchema.index({ timestamp: -1, severity: 1 });

/**
 * Notification model
 */
export const NotificationModel = mongoose.model<NotificationDocument>(
  'Notification',
  notificationSchema
);
