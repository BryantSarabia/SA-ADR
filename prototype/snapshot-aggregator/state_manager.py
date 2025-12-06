"""
State Manager Module

Manages in-memory state of the Digital Twin by consuming streaming data
from Kafka topics and maintaining the current state of all entities.

Responsibilities:
- Maintain current state of districts, vehicles, and buildings
- Thread-safe updates from multiple consumer threads
- State TTL (time-to-live) management for stale data
- Provide aggregated state for snapshot building
"""

import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class StateManager:
    """
    Thread-safe state manager for Digital Twin entities.
    
    Maintains current state by consuming streaming updates and
    provides aggregated state for snapshot generation.
    """
    
    def __init__(self, state_ttl_seconds: int = 30):
        """
        Initialize state manager.
        
        Args:
            state_ttl_seconds: Time-to-live for state entries (default 30s)
        """
        self.state_ttl = timedelta(seconds=state_ttl_seconds)
        
        # State storage: organized by district/vehicle/building
        self.districts_state: Dict[str, Dict] = defaultdict(dict)
        self.edges_state: Dict[str, Dict] = defaultdict(dict)  # edge_id → edge data
        self.vehicles_state: Dict[str, Dict] = {}
        self.buildings_state: Dict[str, Dict] = {}
        
        # Track last update time for TTL management
        self.last_update_time: Dict[str, datetime] = {}
        
        # Thread lock for atomic updates
        self.lock = threading.RLock()
        
        logger.info(f"StateManager initialized (TTL: {state_ttl_seconds}s)")
    
    def update_speed_sensor(self, data: Dict[str, Any]):
        """
        Update state from city-speed-sensors topic.
        
        Args:
            data: Message from city-speed-sensors topic
        """
        with self.lock:
            district_id = data.get('district_id')
            edge_id = data.get('edge_id')
            
            if not district_id or not edge_id:
                return
            
            # Store edge-level data
            self.edges_state[edge_id] = {
                'district_id': district_id,
                'edge_id': edge_id,
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude'),
                'sensor_type': 'speed',
                'speed_kmh': data.get('speed_kmh'),
                'sensor_readings': data.get('sensor_readings', []),
                'timestamp': data.get('timestamp')
            }
            
            # Update district aggregation
            if district_id not in self.districts_state:
                self.districts_state[district_id] = {
                    'district_id': district_id,
                    'edges': {}
                }
            
            self.districts_state[district_id]['edges'][edge_id] = self.edges_state[edge_id]
            self.last_update_time[f"edge_{edge_id}_speed"] = datetime.utcnow()
            
            logger.debug(f"Updated speed sensor: {district_id}/{edge_id}")
    
    def update_weather_sensor(self, data: Dict[str, Any]):
        """
        Update state from city-weather-sensors topic.
        
        Args:
            data: Message from city-weather-sensors topic
        """
        with self.lock:
            district_id = data.get('district_id')
            edge_id = data.get('edge_id')
            
            if not district_id or not edge_id:
                return
            
            # Store or update edge weather data
            if edge_id not in self.edges_state:
                self.edges_state[edge_id] = {'district_id': district_id, 'edge_id': edge_id}
            
            self.edges_state[edge_id].update({
                'weather': {
                    'temperature_c': data.get('temperature_c'),
                    'humidity': data.get('humidity'),
                    'weather_conditions': data.get('weather_conditions'),
                    'timestamp': data.get('timestamp')
                }
            })
            
            # Update district
            if district_id in self.districts_state:
                self.districts_state[district_id]['edges'][edge_id] = self.edges_state[edge_id]
            
            self.last_update_time[f"edge_{edge_id}_weather"] = datetime.utcnow()
            logger.debug(f"Updated weather sensor: {district_id}/{edge_id}")
    
    def update_camera_sensor(self, data: Dict[str, Any]):
        """
        Update state from city-camera-sensors topic.
        
        Args:
            data: Message from city-camera-sensors topic
        """
        with self.lock:
            district_id = data.get('district_id')
            edge_id = data.get('edge_id')
            
            if not district_id or not edge_id:
                return
            
            # Store or update edge camera data
            if edge_id not in self.edges_state:
                self.edges_state[edge_id] = {'district_id': district_id, 'edge_id': edge_id}
            
            self.edges_state[edge_id].update({
                'camera': {
                    'road_condition': data.get('road_condition'),
                    'confidence_score': data.get('confidence_score'),
                    'vehicle_count': data.get('vehicle_count'),
                    'timestamp': data.get('timestamp')
                }
            })
            
            # Update district
            if district_id in self.districts_state:
                self.districts_state[district_id]['edges'][edge_id] = self.edges_state[edge_id]
            
            self.last_update_time[f"edge_{edge_id}_camera"] = datetime.utcnow()
            logger.debug(f"Updated camera sensor: {district_id}/{edge_id}")
    
    def update_vehicle(self, data: Dict[str, Any]):
        """
        Update state from vehicles-telemetry topic.
        
        Args:
            data: Message from vehicles-telemetry topic
        """
        with self.lock:
            vehicle_id = data.get('vehicle_id')
            
            if not vehicle_id:
                return
            
            # Store complete vehicle state
            self.vehicles_state[vehicle_id] = {
                'vehicle_id': vehicle_id,
                'type': data.get('type'),
                'name': data.get('name'),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude'),
                'altitude_m': data.get('altitude_m'),
                'speed_kmh': data.get('speed_kmh'),
                'direction_degrees': data.get('direction_degrees'),
                'heading': data.get('heading'),
                'battery_level_percent': data.get('battery_level_percent'),
                'incident_detected': data.get('incident_detected', False),
                'route_priority': data.get('route_priority'),
                'current_destination': data.get('current_destination'),
                'operational': data.get('operational', True),
                'timestamp': data.get('timestamp')
            }
            
            self.last_update_time[f"vehicle_{vehicle_id}"] = datetime.utcnow()
            logger.debug(f"Updated vehicle: {vehicle_id}")
    
    def update_building(self, data: Dict[str, Any]):
        """
        Update state from buildings-monitoring topic.
        
        Args:
            data: Message from buildings-monitoring topic
        """
        with self.lock:
            building_id = data.get('building_id')
            
            if not building_id:
                return
            
            # Initialize building if not exists
            if building_id not in self.buildings_state:
                self.buildings_state[building_id] = {
                    'building_id': building_id,
                    'name': data.get('name'),
                    'type': data.get('type'),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'sensors': {}
                }
            
            # Update sensor data based on sensor_type
            sensor_type = data.get('sensor_type')
            if sensor_type:
                self.buildings_state[building_id]['sensors'][sensor_type] = {
                    'type': sensor_type,
                    'data': data.get('measurements', {}),
                    'timestamp': data.get('timestamp')
                }
            
            self.last_update_time[f"building_{building_id}"] = datetime.utcnow()
            logger.debug(f"Updated building: {building_id}")
    
    def cleanup_stale_state(self):
        """
        Remove state entries that haven't been updated within TTL.
        
        This prevents stale data from appearing in snapshots when
        sensors/vehicles/buildings go offline.
        """
        with self.lock:
            now = datetime.utcnow()
            stale_keys = [
                key for key, last_update in self.last_update_time.items()
                if now - last_update > self.state_ttl
            ]
            
            for key in stale_keys:
                del self.last_update_time[key]
                logger.warning(f"Removed stale state: {key}")
    
    def get_snapshot_state(self) -> Dict[str, Any]:
        """
        Get current aggregated state for snapshot building.
        
        Returns:
            Dictionary with districts, vehicles, and buildings state
        """
        with self.lock:
            # Cleanup stale data before building snapshot
            self.cleanup_stale_state()
            
            return {
                'districts': dict(self.districts_state),
                'edges': dict(self.edges_state),
                'vehicles': dict(self.vehicles_state),
                'buildings': dict(self.buildings_state),
                'total_entities': {
                    'districts': len(self.districts_state),
                    'edges': len(self.edges_state),
                    'vehicles': len(self.vehicles_state),
                    'buildings': len(self.buildings_state)
                }
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about current state.
        
        Returns:
            Statistics dictionary
        """
        with self.lock:
            return {
                'total_districts': len(self.districts_state),
                'total_edges': len(self.edges_state),
                'total_vehicles': len(self.vehicles_state),
                'total_buildings': len(self.buildings_state),
                'total_updates': len(self.last_update_time)
            }
