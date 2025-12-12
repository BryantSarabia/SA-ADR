import mongoose from 'mongoose';
import { ApiServer } from './api/server';
import { NotificationConsumer } from './kafka/consumer';
import { logger } from './utils/logger';

/**
 * Main application class
 */
class NotificationManager {
  private apiServer: ApiServer;
  private kafkaConsumer: NotificationConsumer;

  constructor() {
    this.apiServer = new ApiServer();
    this.kafkaConsumer = new NotificationConsumer();
  }

  /**
   * Initialize and start the application
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Notification Manager...');

      // Connect to MongoDB
      await this.connectToMongoDB();

      // Start Kafka consumer
      await this.kafkaConsumer.start();

      // Start API server
      await this.apiServer.start();

      logger.info('Notification Manager started successfully');
    } catch (error) {
      logger.error('Failed to start Notification Manager:', error);
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Connect to MongoDB
   */
  private async connectToMongoDB(): Promise<void> {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notifications';

    try {
      await mongoose.connect(uri);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Stop the application gracefully
   */
  async stop(): Promise<void> {
    logger.info('Stopping Notification Manager...');

    try {
      await this.kafkaConsumer.stop();
      await this.apiServer.stop();
      await mongoose.connection.close();
      logger.info('Notification Manager stopped successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Create and start the application
const app = new NotificationManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await app.stop();
  process.exit(0);
});

// Start the application
app.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
