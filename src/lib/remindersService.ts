/**
 * Reminders Service
 * Handles push notifications, email reminders, and in-app notifications for events
 */

/**
 * Check if the browser supports service workers and push notifications
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Request permission for push notifications
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  return Notification.requestPermission();
}

/**
 * Check if push notifications are enabled
 */
export function arePushNotificationsEnabled(): boolean {
  return isPushNotificationSupported() && Notification.permission === 'granted';
}

/**
 * Get the push notification subscription for the current user
 */
export async function getPushNotificationSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Subscribe to push notifications with a public key
 */
export async function subscribeToPushNotifications(publicKey: string): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Push notification permission not granted');
  }

  try {
    // Register service worker first
    await registerServiceWorker();

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey ? urlBase64ToUint8Array(publicKey) : undefined,
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Convert URL-safe Base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Show an in-app notification
 */
export function showInAppNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
  } = {}
): Notification | null {
  if (!isPushNotificationSupported()) {
    return null;
  }

  // Check if we already have an active notification with this tag
  if (options.tag && Notification.permission === 'granted') {
    // Find and close existing notification with same tag
    if ('getNotifications' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications({ tag: options.tag }).then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  }

  return null;
}

/**
 * Calculate reminder time based on event date and reminder preference
 */
export function calculateReminderTime(
  eventDate: string,
  eventTime: string | null,
  reminderBefore: '15m' | '1h' | '24h' | 'week' = '24h'
): Date {
  const eventDateTime = new Date(eventDate + (eventTime ? `T${eventTime}` : 'T00:00:00'));

  const reminderMap: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
  };

  const reminderMs = reminderMap[reminderBefore] || reminderMap['24h'];
  return new Date(eventDateTime.getTime() - reminderMs);
}

/**
 * Format reminder time for display
 */
export function formatReminderTime(reminderBefore: string): string {
  const reminderMap: Record<string, string> = {
    '15m': '15 minutes before',
    '1h': '1 hour before',
    '24h': '24 hours before',
    'week': '1 week before',
  };

  return reminderMap[reminderBefore] || '24 hours before';
}

/**
 * Check if a reminder should be sent based on current time
 */
export function shouldSendReminder(reminderScheduledFor: Date, now: Date = new Date()): boolean {
  // Send reminder if we're within 5 minutes of the scheduled time
  const timeDiff = Math.abs(now.getTime() - reminderScheduledFor.getTime());
  return timeDiff < 5 * 60 * 1000; // 5 minutes window
}

/**
 * Create a notification payload for an event reminder
 */
export function createEventReminderPayload(
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  organizerName: string
): { title: string; body: string; icon: string; badge: string } {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    title: '📅 Event Reminder',
    body: `${eventTitle} by ${organizerName} is coming up on ${eventDateFormatted} at ${eventLocation}`,
    icon: '/icons/event-reminder-icon.png',
    badge: '/icons/event-badge.png',
  };
}
