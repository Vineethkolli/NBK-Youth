import { precacheAndRoute } from 'workbox-precaching';
import { setCacheNameDetails } from 'workbox-core';

// Define the name of your specific offline cache
setCacheNameDetails({
  prefix: 'nbkyouth',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime'
});

// The path to your offline page file, which must be precached
const OFFLINE_URL = '/offline.html';

precacheAndRoute(self.__WB_MANIFEST || []);

// Force the new service worker to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});


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
