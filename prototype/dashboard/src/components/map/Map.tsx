import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import { config } from '../../config';

interface MapProps {
  children?: React.ReactNode;
}

export function Map({ children }: MapProps) {
  return (
    <MapContainer
      center={[config.map.center.lat, config.map.center.lng]}
      zoom={config.map.zoom}
      minZoom={config.map.minZoom}
      maxZoom={config.map.maxZoom}
      className="w-full h-full"
      style={{ background: '#f0f0f0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
