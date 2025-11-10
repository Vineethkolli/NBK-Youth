import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

// ✅ Install — don’t activate immediately; let app trigger SKIP_WAITING manually
self.addEventListener('install', (event) => {
});

// ✅ Activate — take control once activated
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ✅ Handle "SKIP_WAITING" message from app (manual reload flow)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle Vibe background action
  if (event.data.type === 'MEDIA_SESSION_ACTION') {
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

// ✅ Handle push notifications
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

// ✅ Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/notifications';
  const isExternal = link.startsWith('http');
  const targetLink = isExternal ? link : new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus if window already open, else open new one
      for (const client of clientList) {
        if ('focus' in client) {
          if (!isExternal) {
            client.focus();
            client.navigate(targetLink);
          }
          return;
        }
      }
      return self.clients.openWindow(targetLink);
    })
  );
});
