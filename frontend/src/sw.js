import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// Precache the __WB_MANIFEST (includes files from includeAssets)
precacheAndRoute(self.__WB_MANIFEST || []);

// Activate immediately
self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Navigation fallback: try network first; if it fails, serve precached offline.html
const networkFirstHandler = new NetworkFirst({
  cacheName: 'pages-cache',
});

registerRoute(
  // match navigation requests
  ({ request }) => request.mode === 'navigate',
  // custom handler: prefer network, else cached page, else offline.html
  async (args) => {
    try {
      const response = await networkFirstHandler.handle(args);
      if (response) return response;
      // if networkFirst returned nothing, try precached offline page
      return matchPrecache('/offline.html');
    } catch (err) {
      // on exception return offline page
      return matchPrecache('/offline.html');
    }
  }
);


// Notification logic with high priority
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Default Title';
  const options = {
    body: data.body || 'Default message',
    icon: '/logo/192.png',
    badge: '/logo/notificationlogo.png',
    requireInteraction: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/notifications'));
});


// Handle vibe song actions when app is in background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEDIA_SESSION_ACTION') {
    // Forward media session actions to the main app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          // Focus the existing window and navigate to vibe page
          const client = clientList[0];
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO_VIBE',
            action: event.data.action
          });
        } else {
          // Open new window to vibe page
          clients.openWindow('/vibe');
        }
      })
    );
  }
});
