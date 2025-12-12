import { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import { ZodError } from 'zod';
import { NotificationModel } from '../models/notification.model';
import { logger } from '../utils/logger';
import { incomingNotificationSchema } from '../utils/validation';

/**
 * Kafka consumer for notification messages
 */
export class NotificationConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private topic: string;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'notification-manager';
    const groupId = process.env.KAFKA_GROUP_ID || 'notification-manager-group';
    this.topic = process.env.KAFKA_NOTIFICATIONS_TOPIC || 'city.notifications';

    this.kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });
  }

  /**
   * Connect to Kafka and start consuming messages
   */
  async start(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info('Kafka consumer connected');

      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });

      logger.info(`Subscribed to topic: ${this.topic}`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleMessage(topic, partition, message);
        },
      });

      logger.info('Kafka consumer started');
    } catch (error) {
      logger.error('Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(
    topic: string,
    partition: number,
    message: KafkaMessage
  ): Promise<void> {
    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawPayload = JSON.parse(message.value.toString());

      // Validate payload with Zod
      const validatedPayload = incomingNotificationSchema.parse(rawPayload);

      // Create notification in database
      const notification = new NotificationModel({
        message: validatedPayload.message,
        severity: validatedPayload.severity,
        source: validatedPayload.source,
        timestamp: validatedPayload.timestamp,
      });

      await notification.save();

      logger.info('Notification stored', {
        id: notification._id,
        severity: notification.severity,
        source: notification.source,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Invalid notification message format', { 
          errors: error.errors,
          topic,
          partition 
        });
        return;
      }
      logger.error('Error processing notification message', { error, topic, partition });
    }
  }

  /**
   * Stop the Kafka consumer
   */
  async stop(): Promise<void> {
    try {
      await this.consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error('Error stopping Kafka consumer:', error);
      throw error;
    }
  }
}
