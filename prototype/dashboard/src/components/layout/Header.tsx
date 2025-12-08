import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useWebSocketStore } from '../../stores';
import { NotificationBell, NotificationPanel } from '../notifications';

export function Header() {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const connectionState = useWebSocketStore((state) => state.connectionState);

  const handleBellClick = () => {
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              L'Aquila Digital Twin
            </h1>
            <p className="text-xs text-gray-500">Real-time City Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* WebSocket Connection Status */}
          <div className="flex items-center gap-2">
            {connectionState === 'connected' ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Live</span>
              </>
            ) : connectionState === 'connecting' ? (
              <>
                <Wifi className="w-5 h-5 text-yellow-600 animate-pulse" />
                <span className="text-sm text-gray-600">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600">Disconnected</span>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <NotificationBell onClick={handleBellClick} />
            <NotificationPanel
              isOpen={isNotificationPanelOpen}
              onClose={() => setIsNotificationPanelOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
