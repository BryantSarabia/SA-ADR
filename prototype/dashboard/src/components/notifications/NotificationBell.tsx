import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../stores';

interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
