"""
Snapshot Aggregator Service

Main entry point for the Digital Twin Snapshot Aggregator.
Consumes streaming data from Kafka topics, maintains current state,
and publishes periodic snapshots.

Architecture:
- Multi-threaded Kafka consumers (one per topic)
- Thread-safe state manager
- Scheduled snapshot publishing
- Graceful shutdown handling
"""

import os
import sys
import json
import logging
import signal
import threading
from datetime import datetime
from typing import Dict, Any
from time import sleep

from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
from apscheduler.schedulers.background import BackgroundScheduler

# Add common module to path
sys.path.append('/app/common')
from kafka_utils import create_kafka_consumer, create_kafka_producer

from state_manager import StateManager
from snapshot_builder import SnapshotBuilder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SnapshotAggregator:
    """
    Main aggregator service that orchestrates:
    - Multi-topic consumption
    - State management
    - Snapshot building
    - Periodic publishing
    """
    
    def __init__(self, config_path: str = '/app/config/aggregator_config.json'):
        """
        Initialize snapshot aggregator.
        
        Args:
            config_path: Path to configuration file
        """
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        logger.info("Snapshot Aggregator starting...")
        logger.info(f"Configuration: {json.dumps(self.config, indent=2)}")
        
        # Initialize components
        self.state_manager = StateManager(
            state_ttl_seconds=self.config.get('state_ttl_seconds', 30)
        )
        self.snapshot_builder = SnapshotBuilder(
            city_config=self.config.get('city', {})
        )
        
        # Kafka setup
        kafka_config = self.config['kafka']
        self.bootstrap_servers = kafka_config['bootstrap_servers']
        self.consumer_topics = kafka_config['consumer_topics']
        self.producer_topic = kafka_config['producer_topic']
        self.consumer_group = kafka_config.get('consumer_group', 'snapshot-aggregator-group')
        
        # Initialize Kafka producer
        self.producer = None
        self._init_producer()
        
        # Consumer threads
        self.consumer_threads = []
        self.stop_event = threading.Event()
        
        # Scheduler for periodic snapshots
        self.scheduler = BackgroundScheduler()
        self.snapshot_interval = self.config.get('snapshot_interval_seconds', 10)
        
        # Statistics
        self.stats = {
            'snapshots_published': 0,
            'messages_consumed': 0,
            'start_time': datetime.utcnow()
        }
    
    def _init_producer(self):
        """Initialize Kafka producer with retry logic."""
        max_retries = 5
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                self.producer = create_kafka_producer(
                    bootstrap_servers=self.bootstrap_servers
                )
                logger.info("Kafka producer initialized successfully")
                return
            except Exception as e:
                logger.error(f"Failed to create Kafka producer (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    sleep(retry_delay)
                else:
                    raise
    
    def start_consumers(self):
        """Start consumer threads for all topics."""
        # Topic → callback mapping
        topic_callbacks = {
            self.consumer_topics['city_speed']: self.state_manager.update_speed_sensor,
            self.consumer_topics['city_weather']: self.state_manager.update_weather_sensor,
            self.consumer_topics['city_camera']: self.state_manager.update_camera_sensor,
            self.consumer_topics['vehicles']: self.state_manager.update_vehicle,
            self.consumer_topics['buildings']: self.state_manager.update_building,
        }
        
        for topic, callback in topic_callbacks.items():
            thread = threading.Thread(
                target=self._consume_topic,
                args=(topic, callback),
                daemon=True
            )
            thread.start()
            self.consumer_threads.append(thread)
            logger.info(f"Started consumer thread for topic: {topic}")
    
    def _consume_topic(self, topic: str, callback):
        """
        Consume messages from a specific topic.
        
        Args:
            topic: Kafka topic name
            callback: Function to call with each message
        """
        max_retries = 3
        retry_delay = 10
        
        for attempt in range(max_retries):
            try:
                consumer = create_kafka_consumer(
                    bootstrap_servers=self.bootstrap_servers,
                    topic=topic,  # Fixed: use 'topic' not 'topics'
                    group_id=self.consumer_group
                )
                
                logger.info(f"Consumer connected to topic: {topic}")
                
                for message in consumer:
                    if self.stop_event.is_set():
                        break
                    
                    try:
                        # Process message  
                        # Note: kafka_utils deserializes as string, need to parse JSON
                        import json
                        data = json.loads(message.value) if isinstance(message.value, str) else message.value
                        callback(data)
                        self.stats['messages_consumed'] += 1
                        
                        if self.stats['messages_consumed'] % 100 == 0:
                            logger.info(f"Consumed {self.stats['messages_consumed']} messages total")
                    
                    except Exception as e:
                        logger.error(f"Error processing message from {topic}: {e}")
                
                consumer.close()
                break  # Exit retry loop on clean shutdown
            
            except Exception as e:
                logger.error(f"Consumer error for {topic} (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    sleep(retry_delay)
                else:
                    logger.error(f"Failed to start consumer for {topic} after {max_retries} attempts")
    
    def publish_snapshot(self):
        """
        Build and publish current snapshot to Kafka.
        
        This is called periodically by the scheduler.
        """
        try:
            # Get current state
            state = self.state_manager.get_snapshot_state()
            
            # Build snapshot
            snapshot = self.snapshot_builder.build_snapshot(state)
            
            # Add statistics
            snapshot['_internal_stats'] = {
                'total_entities': state.get('total_entities', {}),
                'snapshot_number': self.stats['snapshots_published'] + 1,
                'aggregator_uptime_seconds': (datetime.utcnow() - self.stats['start_time']).total_seconds()
            }
            
            # Publish to Kafka
            self.producer.send(
                self.producer_topic,
                value=snapshot
            ).get(timeout=10)
            
            self.stats['snapshots_published'] += 1
            
            logger.info(
                f"Published snapshot #{self.stats['snapshots_published']} "
                f"({len(json.dumps(snapshot))} bytes) - "
                f"Districts: {len(snapshot.get('districts', []))}, "
                f"Vehicles: {len(state.get('vehicles', {}))}, "
                f"Buildings: {len(state.get('buildings', {}))}"
            )
        
        except Exception as e:
            logger.error(f"Error publishing snapshot: {e}", exc_info=True)
    
    def start_scheduler(self):
        """Start periodic snapshot publishing."""
        self.scheduler.add_job(
            func=self.publish_snapshot,
            trigger='interval',
            seconds=self.snapshot_interval,
            id='snapshot_publisher'
        )
        self.scheduler.start()
        logger.info(f"Scheduler started: publishing snapshots every {self.snapshot_interval} seconds")
    
    def run(self):
        """Main run loop."""
        try:
            # Start consumers
            logger.info("Starting Kafka consumers...")
            self.start_consumers()
            
            # Wait for initial state to populate
            logger.info("Waiting 5 seconds for initial state population...")
            sleep(5)
            
            # Start scheduler
            logger.info("Starting snapshot scheduler...")
            self.start_scheduler()
            
            # Log initial state
            stats = self.state_manager.get_stats()
            logger.info(f"Initial state: {stats}")
            
            # Keep running until stop signal
            logger.info("Snapshot Aggregator running. Press Ctrl+C to stop.")
            while not self.stop_event.is_set():
                sleep(1)
        
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        except Exception as e:
            logger.error(f"Fatal error: {e}", exc_info=True)
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Graceful shutdown."""
        logger.info("Shutting down Snapshot Aggregator...")
        
        # Stop consumers
        self.stop_event.set()
        
        # Stop scheduler
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
        
        # Close producer
        if self.producer:
            self.producer.close()
        
        # Wait for consumer threads
        for thread in self.consumer_threads:
            thread.join(timeout=5)
        
        # Final statistics
        logger.info(f"Final statistics: {self.stats}")
        logger.info("Snapshot Aggregator stopped")


def main():
    """Main entry point."""
    # Setup signal handlers for graceful shutdown
    aggregator = SnapshotAggregator()
    
    def signal_handler(sig, frame):
        logger.info(f"Received signal {sig}")
        aggregator.stop_event.set()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run aggregator
    aggregator.run()


if __name__ == '__main__':
    main()
