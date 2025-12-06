"""
Snapshot Builder Module

Transforms internal state into the JSON format required by the colleague's
Digital Twin specification (city-digital-twin.json format).

Responsibilities:
- Convert streaming state to snapshot format
- Map sensor data to colleague's schema
- Build complete city-digital-twin JSON structure
- Handle missing/optional fields gracefully
"""

import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class SnapshotBuilder:
    """
    Builds Digital Twin snapshot from current state.
    
    Transforms streaming data format to snapshot format compatible
    with colleague's city-digital-twin.json schema.
    """
    
    def __init__(self, city_config: Dict[str, Any]):
        """
        Initialize snapshot builder.
        
        Args:
            city_config: Configuration with cityId, name, version
        """
        self.city_id = city_config.get('cityId', 'laquila-dt-001')
        self.city_name = city_config.get('name', "L'Aquila Digital Twin")
        self.version = city_config.get('version', '1.0')
        
        logger.info(f"SnapshotBuilder initialized: {self.city_id}")
    
    def build_snapshot(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build complete Digital Twin snapshot from current state.
        
        Args:
            state: Current state from StateManager.get_snapshot_state()
        
        Returns:
            Complete snapshot in colleague's JSON format
        """
        now = datetime.utcnow().isoformat() + 'Z'
        
        snapshot = {
            'cityId': self.city_id,
            'timestamp': now,
            'metadata': {
                'name': self.city_name,
                'version': self.version,
                'lastUpdated': now
            },
            'districts': self._build_districts(state),
            'publicTransport': self._build_public_transport(state),
            'emergencyServices': self._build_emergency_services(state)
        }
        
        logger.debug(f"Built snapshot: {len(state.get('districts', {}))} districts, "
                    f"{len(state.get('vehicles', {}))} vehicles, "
                    f"{len(state.get('buildings', {}))} buildings")
        
        return snapshot
    
    def _build_districts(self, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Build districts array from state.
        
        Args:
            state: Current state
        
        Returns:
            List of district objects
        """
        districts = []
        districts_state = state.get('districts', {})
        edges_state = state.get('edges', {})
        buildings_state = state.get('buildings', {})
        
        # Map district IDs to readable names
        district_names = {
            'district-centro': 'Centro Storico',
            'district-collemaggio': 'Collemaggio',
            'district-pettino': 'Pettino'
        }
        
        for district_id, district_data in districts_state.items():
            district = {
                'districtId': district_id,
                'name': district_names.get(district_id, district_id),
                'location': {
                    'centerLatitude': 42.3498,  # L'Aquila center
                    'centerLongitude': 13.3995
                },
                'sensors': self._build_district_sensors(district_data, edges_state),
                'buildings': self._build_district_buildings(district_id, buildings_state),
                'weatherStations': self._build_weather_stations(district_data, edges_state)
            }
            
            districts.append(district)
        
        return districts
    
    def _build_district_sensors(self, district_data: Dict, edges_state: Dict) -> List[Dict]:
        """
        Build sensors array for a district from all its edges.
        
        Args:
            district_data: District state data
            edges_state: All edges state
        
        Returns:
            List of sensor objects
        """
        sensors = []
        edges = district_data.get('edges', {})
        
        for edge_id, edge_data in edges.items():
            # Speed sensors (converted to vehicleCount for compatibility)
            if 'speed_kmh' in edge_data:
                sensor_readings = edge_data.get('sensor_readings', [])
                for reading in sensor_readings:
                    sensors.append({
                        'sensorId': reading.get('sensor_id'),
                        'type': 'vehicleCount',  # Map speed → vehicleCount
                        'location': {
                            'latitude': edge_data.get('latitude'),
                            'longitude': edge_data.get('longitude')
                        },
                        'value': int(reading.get('speed_kmh', 0)),
                        'unit': 'km/h',
                        'status': 'active',
                        'lastUpdated': edge_data.get('timestamp')
                    })
            
            # Camera sensors
            if 'camera' in edge_data:
                camera = edge_data['camera']
                sensors.append({
                    'sensorId': f"camera-{edge_id}",
                    'type': 'trafficCamera',
                    'location': {
                        'latitude': edge_data.get('latitude'),
                        'longitude': edge_data.get('longitude')
                    },
                    'value': self._road_condition_to_congestion(camera.get('road_condition')),
                    'unit': 'congestionLevel',
                    'metadata': {
                        'roadCondition': camera.get('road_condition'),
                        'confidenceScore': camera.get('confidence_score'),
                        'vehicleCount': camera.get('vehicle_count')
                    },
                    'status': 'active',
                    'lastUpdated': camera.get('timestamp')
                })
        
        return sensors
    
    def _road_condition_to_congestion(self, condition: str) -> int:
        """
        Convert road_condition string to congestionLevel numeric (0-100).
        
        Args:
            condition: Road condition (clear, congestion, accident, etc.)
        
        Returns:
            Congestion level 0-100
        """
        mapping = {
            'clear': 10,
            'congestion': 70,
            'accident': 95,
            'obstacles': 80,
            'flooding': 100
        }
        return mapping.get(condition, 50)
    
    def _build_district_buildings(self, district_id: str, buildings_state: Dict) -> List[Dict]:
        """
        Build buildings array for a district.
        
        Args:
            district_id: District ID
            buildings_state: All buildings state
        
        Returns:
            List of building objects for this district
        """
        buildings = []
        
        # Map buildings to districts based on naming convention
        # building-hospital-001 → likely in centro
        # building-basilica-001 → collemaggio
        # building-university-001 → pettino
        
        district_building_mapping = {
            'district-centro': ['hospital', 'school'],
            'district-collemaggio': ['basilica'],
            'district-pettino': ['office', 'university']
        }
        
        building_types = district_building_mapping.get(district_id, [])
        
        for building_id, building_data in buildings_state.items():
            building_type = building_data.get('type', '')
            
            # Check if this building belongs to this district
            if any(bt in building_id or bt == building_type for bt in building_types):
                building = {
                    'buildingId': building_id,
                    'name': building_data.get('name', building_id),
                    'type': building_type,
                    'location': {
                        'latitude': building_data.get('latitude'),
                        'longitude': building_data.get('longitude')
                    },
                    'sensors': self._build_building_sensors(building_data),
                    'status': 'operational'
                }
                buildings.append(building)
        
        return buildings
    
    def _build_building_sensors(self, building_data: Dict) -> List[Dict]:
        """
        Build sensors array for a building.
        
        Args:
            building_data: Building state data
        
        Returns:
            List of sensor objects
        """
        sensors = []
        building_sensors = building_data.get('sensors', {})
        
        for sensor_type, sensor_data in building_sensors.items():
            if sensor_type == 'air_quality':
                measurements = sensor_data.get('data', {})
                sensors.append({
                    'sensorId': f"{building_data.get('building_id')}-aq",
                    'type': 'airQuality',
                    'measurements': {
                        'pm25_ugm3': measurements.get('pm25_ugm3'),
                        'pm10_ugm3': measurements.get('pm10_ugm3'),
                        'no2_ugm3': measurements.get('no2_ugm3'),
                        'co_ppm': measurements.get('co_ppm'),
                        'o3_ugm3': measurements.get('o3_ugm3')
                    },
                    'status': 'operational',
                    'lastUpdated': sensor_data.get('timestamp')
                })
            
            elif sensor_type == 'acoustic':
                measurements = sensor_data.get('data', {})
                sensors.append({
                    'sensorId': f"{building_data.get('building_id')}-acoustic",
                    'type': 'acoustic',
                    'measurements': {
                        'noise_level_db': measurements.get('noise_level_db'),
                        'peak_db': measurements.get('peak_db'),
                        'average_db_1h': measurements.get('average_db_1h')
                    },
                    'status': 'operational',
                    'lastUpdated': sensor_data.get('timestamp')
                })
        
        return sensors
    
    def _build_weather_stations(self, district_data: Dict, edges_state: Dict) -> List[Dict]:
        """
        Build weather stations array from district edges.
        
        Args:
            district_data: District state
            edges_state: All edges state
        
        Returns:
            List of weather station objects
        """
        stations = []
        edges = district_data.get('edges', {})
        
        for edge_id, edge_data in edges.items():
            if 'weather' in edge_data:
                weather = edge_data['weather']
                station = {
                    'stationId': f"ws-{edge_id}",
                    'name': f"Weather Station {edge_id}",
                    'location': {
                        'latitude': edge_data.get('latitude'),
                        'longitude': edge_data.get('longitude'),
                        'elevation': 700  # Approximate L'Aquila elevation
                    },
                    'readings': {
                        'temperature': weather.get('temperature_c'),
                        'humidity': weather.get('humidity'),
                        'weatherConditions': weather.get('weather_conditions')
                    },
                    'status': 'active',
                    'lastUpdated': weather.get('timestamp')
                }
                stations.append(station)
                break  # One station per district
        
        return stations
    
    def _build_public_transport(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build publicTransport section from vehicles.
        
        Args:
            state: Current state
        
        Returns:
            Public transport object with buses
        """
        buses = []
        vehicles_state = state.get('vehicles', {})
        
        for vehicle_id, vehicle_data in vehicles_state.items():
            if vehicle_data.get('type') == 'bus':
                bus = {
                    'busId': vehicle_id,
                    'route': vehicle_data.get('name', 'Unknown Route'),
                    'location': {
                        'latitude': vehicle_data.get('latitude'),
                        'longitude': vehicle_data.get('longitude'),
                        'currentStop': self._get_current_stop(vehicle_data)
                    },
                    'speed': vehicle_data.get('speed_kmh', 0),
                    'status': 'on-time' if vehicle_data.get('operational') else 'delayed'
                }
                buses.append(bus)
        
        return {
            'buses': buses,
            'stations': []  # Could be extended later
        }
    
    def _get_current_stop(self, vehicle_data: Dict) -> str:
        """
        Get current stop name from destination or location.
        
        Args:
            vehicle_data: Vehicle state
        
        Returns:
            Stop name
        """
        destination = vehicle_data.get('current_destination')
        if destination and isinstance(destination, dict):
            return destination.get('location_name', 'Unknown Stop')
        return 'In Transit'
    
    def _build_emergency_services(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build emergencyServices section from vehicles.
        
        Args:
            state: Current state
        
        Returns:
            Emergency services object with incidents and units
        """
        units = []
        incidents = []
        vehicles_state = state.get('vehicles', {})
        
        # Emergency vehicle types
        emergency_types = {'ambulance', 'firetruck', 'police'}
        
        for vehicle_id, vehicle_data in vehicles_state.items():
            vehicle_type = vehicle_data.get('type')
            
            if vehicle_type in emergency_types:
                # Map vehicle type to unit type
                unit_type_mapping = {
                    'ambulance': 'ambulance',
                    'firetruck': 'fire-truck',
                    'police': 'police'
                }
                
                # Determine status
                status = 'available'
                if vehicle_data.get('route_priority') == 'critical':
                    status = 'responding'
                elif vehicle_data.get('speed_kmh', 0) > 0:
                    status = 'patrol'
                
                unit = {
                    'unitId': vehicle_id,
                    'type': unit_type_mapping.get(vehicle_type, vehicle_type),
                    'status': status,
                    'location': {
                        'latitude': vehicle_data.get('latitude'),
                        'longitude': vehicle_data.get('longitude')
                    }
                }
                
                # Add destination if responding
                if status == 'responding' and vehicle_data.get('current_destination'):
                    dest = vehicle_data['current_destination']
                    if isinstance(dest, dict):
                        unit['destination'] = {
                            'latitude': dest.get('latitude'),
                            'longitude': dest.get('longitude')
                        }
                
                units.append(unit)
                
                # Create incident if vehicle has incident detected
                if vehicle_data.get('incident_detected'):
                    incident = {
                        'incidentId': f"INC-{vehicle_id}",
                        'type': 'collision',
                        'priority': 'critical',
                        'location': {
                            'latitude': vehicle_data.get('latitude'),
                            'longitude': vehicle_data.get('longitude')
                        },
                        'reportedAt': vehicle_data.get('timestamp'),
                        'respondingUnits': [vehicle_id],
                        'status': 'in-progress'
                    }
                    incidents.append(incident)
        
        return {
            'incidents': incidents,
            'units': units
        }
