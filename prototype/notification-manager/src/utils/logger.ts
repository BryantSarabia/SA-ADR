import winston from 'winston';

/**
 * Winston logger configuration
 */
const logLevel = process.env.LOG_LEVEL || (process.env.DEBUG === 'true' ? 'debug' : 'info');

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-manager' },
  transports: [
    // Console transport with colorized output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            metaStr = ' ' + JSON.stringify(meta);
          }
          return `[${timestamp}] [${service}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});
