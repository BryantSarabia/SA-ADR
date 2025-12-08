import { Icon } from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { Sensor } from '../../types';

interface SensorMarkersProps {
  sensors: Sensor[];
}

// Create icons based on status
const createSensorIcon = (status: string) => {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'gray',
    error: 'red',
    degraded: 'orange',
  };
  
  const color = colors[status] || 'blue';
  
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

export function SensorMarkers({ sensors }: SensorMarkersProps) {
  return (
    <>
      {sensors.filter(s => s.location).map((sensor) => (
        <Marker
          key={sensor.sensorId}
          position={[sensor.location!.latitude, sensor.location!.longitude]}
          icon={createSensorIcon(sensor.status)}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">
                {sensor.type}
              </h3>
              <p className="text-xs text-gray-600 mb-1">
                <strong>ID:</strong> {sensor.sensorId}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Value:</strong> {sensor.value} {sensor.unit}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Status:</strong>{' '}
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      sensor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {sensor.status}
                </span>
              </p>
              {sensor.metadata && (
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Congestion:</strong> {sensor.metadata.congestionStatus}<br />
                  <strong>Avg Speed:</strong> {sensor.metadata.avgSpeed} km/h<br />
                  <strong>Vehicles:</strong> {sensor.metadata.vehicleCount}
                </p>
              )}
              <p className="text-xs text-gray-600">
                <strong>Updated:</strong> {new Date(sensor.lastUpdated).toLocaleString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
