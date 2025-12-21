// ==================== Building Enums ====================

export enum BuildingType {
  HOSPITAL = 'hospital',
  SCHOOL = 'school',
  UNIVERSITY = 'university',
  CHURCH = 'church',
  RELIGIOUS = 'religious',
  OFFICE = 'office',
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  GOVERNMENT = 'government',
}

export enum BuildingStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
  EMERGENCY = 'emergency',
}

export enum ElevatorStatus {
  OPERATIONAL = 'operational',
  OUT_OF_SERVICE = 'out_of_service',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
}

export enum ExitStatus {
  UNLOCKED = 'unlocked',
  LOCKED = 'locked',
  BLOCKED = 'blocked',
}

// ==================== Air Quality Enums ====================

export enum AirQualityStatus {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  MODERATE = 'Moderate',
  UNHEALTHY = 'Unhealthy',
}

// ==================== Noise Level Enums ====================

export enum NoiseLevelStatus {
  QUIET = 'Quiet',
  MODERATE = 'Moderate',
  LOUD = 'Loud',
  HAZARDOUS = 'Hazardous',
}

// ==================== Sensor Status Enums ====================

export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  DEGRADED = 'degraded',
}

// ==================== Vehicle Enums ====================

export enum VehicleType {
  CAR = 'car',
  BUS = 'bus',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  EMERGENCY = 'emergency',
}

export enum RoutePriority {
  NORMAL = 'normal',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

// ==================== Icon Names ====================

export enum BuildingIconName {
  HOSPITAL = 'hospital',
  GRADUATION_CAP = 'graduation-cap',
  CHURCH = 'church',
  BRIEFCASE = 'briefcase',
  HOME = 'home',
  BUILDING = 'building',
}

// ==================== Status Colors ====================

export enum StatusColor {
  GREEN = '#4CAF50',
  LIGHT_GREEN = '#8BC34A',
  YELLOW = '#FFC107',
  ORANGE = '#FF9800',
  DEEP_ORANGE = '#FF5722',
  RED = '#F44336',
  GRAY = '#9E9E9E',
}

// ==================== Notification Enums ====================

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum EntityType {
  SENSOR = 'sensor',
  BUILDING = 'building',
  TRANSPORT = 'transport',
  DISTRICT = 'district',
  VEHICLE = 'vehicle',
}

// ==================== WebSocket Enums ====================

export enum WebSocketMessageType {
  FULL_STATE = 'full_state',
  INCREMENTAL_UPDATE = 'incremental_update',
  ERROR = 'error',
  CONNECTION = 'connection',
  PING = 'ping',
  DISTRICT_UPDATE = 'district_update',
}

// ==================== Traffic Enums ====================

export enum TrafficLightStatus {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
}

export enum CongestionLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ==================== Weather Enums ====================

export enum WeatherCondition {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  FOGGY = 'foggy',
  SNOWY = 'snowy',
}
