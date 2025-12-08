import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { config } from '../config';
import { NotificationManagerApi } from '../services/notificationManagerApi';
import { useNotificationStore } from '../stores';

/**
 * Hook to poll for new notifications every 5 seconds
 */
export function useNotificationPolling() {
  const { addNotifications, setLastPollTimestamp, setError } = useNotificationStore();
  const lastPollRef = useRef<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey: ['notifications', 'poll'],
    queryFn: async () => {
      // Get notifications from the last 5 seconds
      const timestampFrom = lastPollRef.current || 
        new Date(Date.now() - 5000).toISOString();
      
      const response = await NotificationManagerApi.getNotifications({
        timestampFrom,
        limit: 50, // Fetch up to 50 new notifications
      });

      return response;
    },
    refetchInterval: config.notificationPollInterval,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Update store when new notifications arrive
  useEffect(() => {
    if (data?.notifications && data.notifications.length > 0) {
      addNotifications(data.notifications);
      
      // Update the last poll timestamp to the most recent notification
      const latestTimestamp = data.notifications[0].timestamp;
      lastPollRef.current = latestTimestamp;
      setLastPollTimestamp(latestTimestamp);
    }
  }, [data, addNotifications, setLastPollTimestamp]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Notification polling error:', error);
      setError(error as Error);
    }
  }, [error, setError]);

  return {
    isLoading,
    error,
    notificationCount: data?.total || 0,
  };
}
