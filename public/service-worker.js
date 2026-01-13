// Service Worker for handling push notifications
self.addEventListener('push', function (event) {
  if (!event.data) {
    console.log('Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/event-reminder-icon.png',
      badge: data.badge || '/icons/event-badge.png',
      tag: data.tag || 'event-reminder',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Event Reminder', options));
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // If the notification has a URL, open it
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.matchAll({ type: 'window' }).then(function (clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    }));
  }
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event.notification.tag);
});
