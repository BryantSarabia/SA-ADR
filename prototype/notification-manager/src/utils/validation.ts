import { z } from 'zod';
import { NotificationSeverity } from '../types';

/**
 * Schema for validating notification query parameters
 */
export const notificationQuerySchema = z.object({
  severity: z
    .union([
      z.nativeEnum(NotificationSeverity),
      z.string().transform((val) => val.split(',')),
    ])
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        if (typeof val === 'string') return true;
        if (Array.isArray(val)) {
          return val.every((v) =>
            Object.values(NotificationSeverity).includes(v as NotificationSeverity)
          );
        }
        return false;
      },
      { message: 'Invalid severity value(s)' }
    ),
  source: z
    .union([
      z.string(),
      z.string().transform((val) => val.split(',')),
    ])
    .optional(),
  timestampFrom: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  timestampTo: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(1000))
    .optional()
    .default('50'),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
  sortBy: z
    .enum(['timestamp', 'createdAt', 'severity'])
    .optional()
    .default('timestamp'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * Schema for validating MongoDB ObjectId
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid notification ID format' });

/**
 * Schema for validating incoming Kafka notification message
 */
export const incomingNotificationSchema = z.object({
  message: z.string().min(1).max(5000),
  severity: z.nativeEnum(NotificationSeverity),
  source: z.string().min(1).trim(),
  timestamp: z.string().datetime().transform((val) => new Date(val)),
});

export type NotificationQueryParams = z.infer<typeof notificationQuerySchema>;
export type IncomingNotificationValidated = z.infer<typeof incomingNotificationSchema>;
