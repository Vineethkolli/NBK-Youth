import { precacheAndRoute } from 'workbox-precaching';

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
    requireInteraction: true,
    data: {
      link: data.link 
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Default to the notifications page if no link is provided
  const link = event.notification.data?.link || '/notifications';

  // Check if it's an external link
  const isExternal = link.startsWith('http');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0 && !isExternal) {
        // App is open and it's an internal link then navigate to the link
        const client = clientList[0];
        return client.focus().then(() => client.navigate(link));
      } else {
        // App is closed or the link is external. Open a new window to target URL
        return clients.openWindow(link);
      }
    })
  );
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
