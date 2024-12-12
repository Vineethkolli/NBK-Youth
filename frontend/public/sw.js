self.addEventListener('push', function(event) {
  let data = {};

  try {
    // Try to parse the push data as JSON
    data = event.data.json();
  } catch (e) {
    // If it's not JSON, handle as plain text
    data = { body: event.data.text() }; // Use text if JSON parsing fails
  }

  const options = {
    body: data.body || 'Default message body',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});

self.addEventListener('install', function(event) {
  // Optional custom installation logic
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  // Activate immediately
  event.waitUntil(self.clients.claim());
});
