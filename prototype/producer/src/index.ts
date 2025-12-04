import dotenv from 'dotenv';
import { Kafka, Producer } from 'kafkajs';

dotenv.config();

class DataProducer {
  private kafka: Kafka;
  private producer: Producer;
  private intervalMs: number;
  private districts = ['DIST-001', 'DIST-002', 'DIST-003'];

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'data-producer';

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.intervalMs = parseInt(process.env.MESSAGE_INTERVAL_MS || '2000');
  }

  async start(): Promise<void> {
    await this.producer.connect();
    console.log('Data producer connected to Kafka');

    // Send messages periodically
    setInterval(() => {
      this.produceMessages();
    }, this.intervalMs);

    console.log(`Producing mock messages every ${this.intervalMs}ms`);
  }

  private async produceMessages(): Promise<void> {
    try {
      const messages = [];

      // Generate sensor data
      messages.push(...this.generateSensorData());

      // Generate building occupancy
      messages.push(...this.generateBuildingOccupancy());

      // Generate weather data
      messages.push(...this.generateWeatherData());

      // Generate traffic data
      messages.push(...this.generateTrafficData());

      // Generate public transport data
      messages.push(...this.generatePublicTransportData());

      // Generate emergency incidents (occasionally)
      if (Math.random() > 0.9) {
        messages.push(...this.generateEmergencyData());
      }

      // Send all messages
      await Promise.all(messages);

      console.log(`Sent ${messages.length} messages at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error producing messages:', error);
    }
  }

  private generateSensorData(): Promise<any>[] {
    const messages = [];

    for (const districtId of this.districts) {
      // Environmental sensors
      messages.push(
        this.producer.send({
          topic: 'sensors.environmental',
          messages: [
            {
              key: districtId,
              value: JSON.stringify({
                districtId,
                sensorId: `PM25-${districtId}`,
                type: 'pm25',
                value: Math.random() * 50 + 10,
                unit: 'μg/m³',
                status: 'active',
                lastUpdated: new Date().toISOString(),
                location: {
                  latitude: 40.71 + Math.random() * 0.04,
                  longitude: -74.00 + Math.random() * 0.02,
                },
              }),
            },
          ],
        })
      );

      // Traffic sensors
      messages.push(
        this.producer.send({
          topic: 'sensors.traffic',
          messages: [
            {
              key: districtId,
              value: JSON.stringify({
                districtId,
                sensorId: `CAM-${districtId}-${Math.floor(Math.random() * 10)}`,
                type: 'trafficCamera',
                value: Math.random() * 100,
                unit: 'vehicles/min',
                status: 'active',
                lastUpdated: new Date().toISOString(),
                location: {
                  latitude: 40.71 + Math.random() * 0.04,
                  longitude: -74.00 + Math.random() * 0.02,
                },
                metadata: {
                  avgSpeed: 30 + Math.random() * 40,
                  vehicleCount: Math.floor(Math.random() * 50),
                  congestionStatus: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)],
                },
              }),
            },
          ],
        })
      );
    }

    return messages;
  }

  private generateBuildingOccupancy(): Promise<any>[] {
    const messages = [];

    for (const districtId of this.districts) {
      const buildingId = `BLDG-${districtId}-${Math.floor(Math.random() * 5)}`;
      const totalCapacity = 1000 + Math.floor(Math.random() * 500);
      const currentOccupancy = Math.floor(Math.random() * totalCapacity);

      messages.push(
        this.producer.send({
          topic: 'buildings.occupancy',
          messages: [
            {
              key: districtId,
              value: JSON.stringify({
                districtId,
                buildingId,
                currentOccupancy,
                totalCapacity,
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        })
      );
    }

    return messages;
  }

  private generateWeatherData(): Promise<any>[] {
    const messages = [];

    for (const districtId of this.districts) {
      messages.push(
        this.producer.send({
          topic: 'weather.stations',
          messages: [
            {
              key: districtId,
              value: JSON.stringify({
                districtId,
                stationId: `WS-${districtId}`,
                readings: {
                  temperature: 15 + Math.random() * 15,
                  humidity: 40 + Math.random() * 40,
                  pressure: 1000 + Math.random() * 30,
                  windSpeed: Math.random() * 20,
                  windDirection: Math.floor(Math.random() * 360),
                  precipitation: Math.random() * 5,
                  cloudCover: Math.random() * 100,
                  visibility: 5 + Math.random() * 10,
                  uvIndex: Math.floor(Math.random() * 11),
                  units: {
                    temperature: 'Celsius',
                    humidity: '%',
                    pressure: 'hPa',
                    windSpeed: 'km/h',
                    windDirection: 'degrees',
                    precipitation: 'mm',
                    cloudCover: '%',
                    visibility: 'km',
                  },
                },
                status: 'active',
                lastUpdated: new Date().toISOString(),
              }),
            },
          ],
        })
      );
    }

    return messages;
  }

  private generateTrafficData(): Promise<any>[] {
    const messages = [];

    for (const districtId of this.districts) {
      const edgeId = `EDGE-${districtId}-${Math.floor(Math.random() * 20)}`;
      const congestionLevels = ['light', 'moderate', 'heavy'];

      messages.push(
        this.producer.send({
          topic: 'traffic.graph',
          messages: [
            {
              key: districtId,
              value: JSON.stringify({
                districtId,
                edgeId,
                trafficConditions: {
                  averageSpeed: 20 + Math.random() * 40,
                  congestionLevel: congestionLevels[Math.floor(Math.random() * 3)],
                  vehicleCount: Math.floor(Math.random() * 100),
                  travelTime: 5 + Math.random() * 15,
                  incidents: [],
                },
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        })
      );
    }

    return messages;
  }

  private generatePublicTransportData(): Promise<any>[] {
    const messages = [];

    // Generate bus GPS updates
    for (let i = 0; i < 3; i++) {
      messages.push(
        this.producer.send({
          topic: 'transport.gps',
          messages: [
            {
              value: JSON.stringify({
                busId: `BUS-${i + 1}`,
                route: `Route-${i + 1}`,
                location: {
                  latitude: 40.71 + Math.random() * 0.04,
                  longitude: -74.00 + Math.random() * 0.02,
                  currentStop: `STOP-${Math.floor(Math.random() * 20)}`,
                },
                speed: 10 + Math.random() * 40,
                occupancy: {
                  current: Math.floor(Math.random() * 50),
                  capacity: 50,
                },
                nextStop: `STOP-${Math.floor(Math.random() * 20)}`,
                estimatedArrival: new Date(Date.now() + 300000).toISOString(),
                status: 'active',
              }),
            },
          ],
        })
      );
    }

    return messages;
  }

  private generateEmergencyData(): Promise<any>[] {
    const messages = [];
    const incidentTypes = ['fire', 'medical', 'accident', 'crime'];
    const priorities = ['low', 'medium', 'high', 'critical'];

    messages.push(
      this.producer.send({
        topic: 'emergency.incidents',
        messages: [
          {
            value: JSON.stringify({
              incidentId: `INC-${Date.now()}`,
              type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
              priority: priorities[Math.floor(Math.random() * priorities.length)],
              location: {
                latitude: 40.71 + Math.random() * 0.04,
                longitude: -74.00 + Math.random() * 0.02,
                address: `${Math.floor(Math.random() * 999)} Main St`,
              },
              reportedAt: new Date().toISOString(),
              respondingUnits: [],
              status: 'active',
            }),
          },
        ],
      })
    );

    return messages;
  }

  async stop(): Promise<void> {
    await this.producer.disconnect();
    console.log('Data producer disconnected');
  }
}

// Start the producer
const producer = new DataProducer();

producer.start().catch((error) => {
  console.error('Failed to start data producer:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await producer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await producer.stop();
  process.exit(0);
});
