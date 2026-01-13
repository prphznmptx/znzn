import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isPushNotificationSupported,
  requestPushNotificationPermission,
  arePushNotificationsEnabled,
  getPushNotificationSubscription,
  subscribeToPushNotifications,
  registerServiceWorker,
} from '../lib/remindersService';
import { subscribeToPushNotifications as saveSubscriptionToDb } from '../lib/eventServices';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<NotificationPermission | null>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported] = useState(isPushNotificationSupported());
  const [isEnabled, setIsEnabled] = useState(arePushNotificationsEnabled());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are enabled on mount
  useEffect(() => {
    if (isSupported) {
      const checkPermission = async () => {
        try {
          const enabled = arePushNotificationsEnabled();
          setIsEnabled(enabled);
        } catch (err) {
          console.error('Error checking push notification status:', err);
        }
      };
      checkPermission();
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (!isSupported) {
      setError('Push notifications are not supported in your browser');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const permission = await requestPushNotificationPermission();
      setIsEnabled(permission === 'granted');
      return permission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in your browser');
      return false;
    }

    if (!user) {
      setError('You must be signed in to enable push notifications');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request permission first if not already granted
      if (Notification.permission !== 'granted') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setError('Push notification permission denied');
          return false;
        }
      }

      // Register service worker
      await registerServiceWorker();

      // Subscribe to push notifications
      // Note: This would require a VAPID public key from your server
      // For now, we'll just subscribe without a key (for development)
      const subscription = await subscribeToPushNotifications('');

      if (subscription) {
        // Save subscription to database
        const result = await saveSubscriptionToDb(user.id, subscription);

        if (result.success) {
          setIsEnabled(true);
          return true;
        } else {
          setError(result.error || 'Failed to save subscription');
          return false;
        }
      } else {
        setError('Failed to subscribe to push notifications');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const subscription = await getPushNotificationSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsEnabled(false);
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
