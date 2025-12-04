import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { RedisStateManager } from '../state/redis-manager';
import { SnapshotManager } from '../state/snapshot-manager';
import { logger } from '../utils/logger';

export class KafkaConsumerManager {
  private kafka: Kafka;
  private consumer: Consumer;
  private redisManager: RedisStateManager;
  private snapshotManager: SnapshotManager;
  private isRunning = false;

  // Kafka topics
  private readonly topics = [
    'sensors.environmental',
    'sensors.traffic',
    'buildings.occupancy',
    'buildings.sensors',
    'weather.stations',
    'traffic.graph',
    'transport.gps',
    'transport.stations',
    'emergency.incidents',
  ];

  constructor(redisManager: RedisStateManager, snapshotManager: SnapshotManager) {
    this.redisManager = redisManager;
    this.snapshotManager = snapshotManager;

    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'state-manager';
    const groupId = process.env.KAFKA_GROUP_ID || 'state-manager-group';

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({ groupId });
  }

  /**
   * Connect and start consuming messages
   */
  async start(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info('Kafka consumer connected');

      // Subscribe to all topics
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`Subscribed to topic: ${topic}`);
      }

      this.isRunning = true;

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      logger.info('Kafka consumer started and running');
    } catch (error) {
      logger.error('Error starting Kafka consumer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka messages
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const data = JSON.parse(message.value.toString());
      logger.debug(`Processing message from ${topic}`, { partition, data });

      // Route message to appropriate handler based on topic
      switch (topic) {
        case 'sensors.environmental':
        case 'sensors.traffic':
          await this.handleSensorData(data);
          break;

        case 'buildings.occupancy':
          await this.handleBuildingOccupancy(data);
          break;

        case 'buildings.sensors':
          await this.handleBuildingSensors(data);
          break;

        case 'weather.stations':
          await this.handleWeatherData(data);
          break;

        case 'traffic.graph':
          await this.handleTrafficGraph(data);
          break;

        case 'transport.gps':
        case 'transport.stations':
          await this.handlePublicTransport(data);
          break;

        case 'emergency.incidents':
          await this.handleEmergencyIncident(data);
          break;

        default:
          logger.warn(`Unknown topic: ${topic}`);
      }

      // Increment change counter for snapshot triggering
      await this.snapshotManager.incrementChangeCounter(
        () => this.redisManager.getCompleteState()
      );

    } catch (error) {
      logger.error(`Error processing message from ${topic}:`, error);
    }
  }

  /**
   * Handle sensor data updates
   */
  private async handleSensorData(data: any): Promise<void> {
    const { districtId, sensorId, type, value, unit, status, lastUpdated, location, metadata } = data;

    if (!districtId || !sensorId) {
      logger.warn('Missing districtId or sensorId in sensor data', data);
      return;
    }

    const district = await this.redisManager.getDistrictState(districtId);

    if (!district) {
      // Create new district
      await this.redisManager.updateDistrictState({
        districtId,
        name: `District ${districtId}`,
        location: {
          centerLatitude: location?.latitude || 0,
          centerLongitude: location?.longitude || 0,
          boundaries: { north: 0, south: 0, east: 0, west: 0 },
        },
        sensors: [{
          sensorId,
          type,
          value,
          unit,
          status: status || 'active',
          lastUpdated: new Date(lastUpdated || Date.now()),
          location,
          metadata,
        }],
        buildings: [],
        weatherStations: [],
        districtGraph: { nodes: [], edges: [] },
      });
    } else {
      // Update existing district
      const sensorIndex = district.sensors.findIndex(s => s.sensorId === sensorId);

      if (sensorIndex !== -1) {
        district.sensors[sensorIndex] = {
          ...district.sensors[sensorIndex],
          value,
          status: status || district.sensors[sensorIndex].status,
          lastUpdated: new Date(lastUpdated || Date.now()),
          ...(location && { location }),
          ...(metadata && { metadata }),
        };
      } else {
        district.sensors.push({
          sensorId,
          type,
          value,
          unit,
          status: status || 'active',
          lastUpdated: new Date(lastUpdated || Date.now()),
          location,
          metadata,
        });
      }

      await this.redisManager.updateDistrictState(district);
    }

    logger.debug(`Updated sensor ${sensorId} in district ${districtId}`);
  }

  /**
   * Handle building occupancy updates
   */
  private async handleBuildingOccupancy(data: any): Promise<void> {
    const { districtId, buildingId, currentOccupancy, totalCapacity } = data;

    if (!districtId || !buildingId) {
      logger.warn('Missing districtId or buildingId in building occupancy data', data);
      return;
    }

    const district = await this.redisManager.getDistrictState(districtId);
    if (!district) return;

    const buildingIndex = district.buildings.findIndex(b => b.buildingId === buildingId);

    if (buildingIndex !== -1) {
      district.buildings[buildingIndex].currentOccupancy = currentOccupancy;
      district.buildings[buildingIndex].occupancyRate = currentOccupancy / totalCapacity;
      await this.redisManager.updateDistrictState(district);
      logger.debug(`Updated building occupancy ${buildingId} in district ${districtId}`);
    }
  }

  /**
   * Handle building sensor updates
   */
  private async handleBuildingSensors(data: any): Promise<void> {
    // Similar to handleSensorData but for building-embedded sensors
    await this.handleSensorData(data);
  }

  /**
   * Handle weather station data
   */
  private async handleWeatherData(data: any): Promise<void> {
    const { districtId, stationId, readings, status, lastUpdated } = data;

    if (!districtId || !stationId) {
      logger.warn('Missing districtId or stationId in weather data', data);
      return;
    }

    const district = await this.redisManager.getDistrictState(districtId);
    if (!district) return;

    const stationIndex = district.weatherStations.findIndex(ws => ws.stationId === stationId);

    if (stationIndex !== -1) {
      district.weatherStations[stationIndex].readings = readings;
      district.weatherStations[stationIndex].status = status || district.weatherStations[stationIndex].status;
      district.weatherStations[stationIndex].lastUpdated = new Date(lastUpdated || Date.now());
      await this.redisManager.updateDistrictState(district);
      logger.debug(`Updated weather station ${stationId} in district ${districtId}`);
    }
  }

  /**
   * Handle traffic graph updates
   */
  private async handleTrafficGraph(data: any): Promise<void> {
    const { districtId, edgeId, trafficConditions } = data;

    if (!districtId || !edgeId) {
      logger.warn('Missing districtId or edgeId in traffic graph data', data);
      return;
    }

    const district = await this.redisManager.getDistrictState(districtId);
    if (!district) return;

    const edgeIndex = district.districtGraph.edges.findIndex(e => e.edgeId === edgeId);

    if (edgeIndex !== -1) {
      district.districtGraph.edges[edgeIndex].trafficConditions = trafficConditions;
      district.districtGraph.edges[edgeIndex].lastUpdated = new Date();
      await this.redisManager.updateDistrictState(district);
      logger.debug(`Updated traffic edge ${edgeId} in district ${districtId}`);
    }
  }

  /**
   * Handle public transport updates
   */
  private async handlePublicTransport(data: any): Promise<void> {
    const currentData = await this.redisManager.getPublicTransport() || { buses: [], stations: [] };

    if (data.busId) {
      // Update bus
      const busIndex = currentData.buses.findIndex((b: any) => b.busId === data.busId);
      if (busIndex !== -1) {
        currentData.buses[busIndex] = { ...currentData.buses[busIndex], ...data };
      } else {
        currentData.buses.push(data);
      }
    } else if (data.stationId) {
      // Update station
      const stationIndex = currentData.stations.findIndex((s: any) => s.stationId === data.stationId);
      if (stationIndex !== -1) {
        currentData.stations[stationIndex] = { ...currentData.stations[stationIndex], ...data };
      } else {
        currentData.stations.push(data);
      }
    }

    await this.redisManager.updatePublicTransport(currentData);
    logger.debug('Updated public transport data');
  }

  /**
   * Handle emergency incident updates
   */
  private async handleEmergencyIncident(data: any): Promise<void> {
    const currentData = await this.redisManager.getEmergencyServices() || { incidents: [], units: [] };

    if (data.incidentId) {
      // Update incident
      const incidentIndex = currentData.incidents.findIndex((i: any) => i.incidentId === data.incidentId);
      if (incidentIndex !== -1) {
        currentData.incidents[incidentIndex] = { ...currentData.incidents[incidentIndex], ...data };
      } else {
        currentData.incidents.push(data);
      }
    } else if (data.unitId) {
      // Update unit
      const unitIndex = currentData.units.findIndex((u: any) => u.unitId === data.unitId);
      if (unitIndex !== -1) {
        currentData.units[unitIndex] = { ...currentData.units[unitIndex], ...data };
      } else {
        currentData.units.push(data);
      }
    }

    await this.redisManager.updateEmergencyServices(currentData);
    logger.debug('Updated emergency services data');
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.consumer.disconnect();
      this.isRunning = false;
      logger.info('Kafka consumer stopped');
    }
  }

  /**
   * Check if Kafka consumer is connected
   */
  isConnected(): boolean {
    return this.isRunning;
  }
}
