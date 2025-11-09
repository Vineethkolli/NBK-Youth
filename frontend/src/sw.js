import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

// Default: do NOT skipWaiting automatically.
// We will prompt the user in the app and call skipWaiting only when they confirm.
self.addEventListener('install', () => {
  // Intentionally no self.skipWaiting() here to respect user choice.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Notification logic with high priority
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Default Title';

  const options = {
    body: data.body || 'Default message',
    icon: '/logo/192.png',
    badge: '/logo/notificationlogo.png',
    requireInteraction: true,
    data: {
      link: data.link,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/notifications';
  const isExternal = link.startsWith('http');
  const targetLink = isExternal ? link : new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((c) => 'focus' in c) || clientList[0];
      if (client && !isExternal) {
        return client.focus().then(() => client.navigate(targetLink));
      } else {
        return self.clients.openWindow(targetLink);
      }
    })
  );
});


// Handle vibe song actions when app is in background
self.addEventListener('message', (event) => {
  const type = event?.data?.type;

  // Respect user's choice: only activate immediately when explicitly told.
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'MEDIA_SESSION_ACTION') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO_VIBE',
            action: event.data.action,
          });
        } else {
          self.clients.openWindow('/vibe');
        }
      })
    );
  }
});
