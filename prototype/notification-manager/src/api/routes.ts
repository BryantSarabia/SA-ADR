import express, { Request, Response } from 'express';
import { ZodError } from 'zod';
import { NotificationModel } from '../models/notification.model';
import { logger } from '../utils/logger';
import { notificationQuerySchema, objectIdSchema } from '../utils/validation';

export function createRoutes() {
  const router = express.Router();

  /**
   * GET /notifications - Get notifications with filters
   * Query parameters:
   * - severity: string | string[] (comma-separated)
   * - source: string | string[] (comma-separated)
   * - timestampFrom: ISO 8601 date string
   * - timestampTo: ISO 8601 date string
   * - limit: number (default: 50, max: 1000)
   * - offset: number (default: 0)
   * - sortBy: 'timestamp' | 'createdAt' | 'severity' (default: 'timestamp')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   */
  router.get('/notifications', async (req: Request, res: Response) => {
    try {
      // Validate and parse query parameters with Zod
      const validatedQuery = notificationQuerySchema.parse(req.query);

      // Build MongoDB query
      const query: any = {};

      // Severity filter
      if (validatedQuery.severity) {
        const severities = Array.isArray(validatedQuery.severity)
          ? validatedQuery.severity
          : [validatedQuery.severity];
        query.severity = { $in: severities };
      }

      // Source filter
      if (validatedQuery.source) {
        const sources = Array.isArray(validatedQuery.source) 
          ? validatedQuery.source 
          : [validatedQuery.source];
        query.source = { $in: sources };
      }

      // Timestamp range filter
      if (validatedQuery.timestampFrom || validatedQuery.timestampTo) {
        query.timestamp = {};
        if (validatedQuery.timestampFrom) {
          query.timestamp.$gte = validatedQuery.timestampFrom;
        }
        if (validatedQuery.timestampTo) {
          query.timestamp.$lte = validatedQuery.timestampTo;
        }
      }

      // Get total count
      const total = await NotificationModel.countDocuments(query);

      // Build sort
      const sortBy = validatedQuery.sortBy;
      const sortOrder = validatedQuery.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // Execute query with pagination
      const limit = validatedQuery.limit;
      const offset = validatedQuery.offset;

      const notifications = await NotificationModel.find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      res.json({
        notifications,
        total,
        limit,
        offset,
      });

      logger.debug('Retrieved notifications', {
        count: notifications.length,
        total,
        filters: validatedQuery,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Invalid query parameters', { errors: error.errors });
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
        return;
      }
      logger.error('Error retrieving notifications', { error });
      res.status(500).json({
        error: 'Failed to retrieve notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /notifications/:id - Get a specific notification by ID
   */
  router.get('/notifications/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Validate MongoDB ObjectId format with Zod
      const validatedId = objectIdSchema.parse(id);

      const notification = await NotificationModel.findById(validatedId).lean().exec();

      if (!notification) {
        res.status(404).json({
          error: 'Notification not found',
        });
        return;
      }

      res.json({
        notification,
      });

      logger.debug('Retrieved notification by ID', { id: validatedId });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Invalid notification ID', { errors: error.errors });
        res.status(400).json({
          error: 'Invalid notification ID format',
          details: error.errors,
        });
        return;
      }
      logger.error('Error retrieving notification by ID', { error });
      res.status(500).json({
        error: 'Failed to retrieve notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /health - Health check endpoint
   */
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      // Check MongoDB connection
      const isConnected = await NotificationModel.db.db.admin().ping();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mongodb: isConnected ? 'connected' : 'disconnected',
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
