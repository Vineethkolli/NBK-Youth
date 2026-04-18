import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

const DEFAULT_NOTIFICATION_ICON = '/logo/192.png';
const DEFAULT_NOTIFICATION_BADGE = '/logo/notificationlogo.png';
const DEFAULT_NOTIFICATION_ROUTE = '/notifications';

const parsePushPayload = (event) => {
  if (!event?.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    try {
      const text = event.data.text();
      return text ? { body: text } : {};
    } catch {
      return {};
    }
  }
};

// Force the new service worker to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Notification logic with high priority
self.addEventListener('push', (event) => {
  const data = parsePushPayload(event);
  const title = data.title || 'NBK Youth';
  const link = data.link || DEFAULT_NOTIFICATION_ROUTE;

  const options = {
    body: data.body || 'You have a new update',
    icon: data.icon || DEFAULT_NOTIFICATION_ICON,
    badge: data.badge || DEFAULT_NOTIFICATION_BADGE,
    requireInteraction: data.requireInteraction ?? true,
    renotify: Boolean(data.renotify),
    tag: data.tag || 'nbk-youth-general',
    timestamp: data.timestamp || Date.now(),
    data: {
      ...data.data,
      link,
    },
  };

  if (Array.isArray(data.actions) && data.actions.length > 0) {
    options.actions = data.actions.slice(0, 2);
  }

  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || DEFAULT_NOTIFICATION_ROUTE;
  const isExternal = link.startsWith('http');
  const targetLink = isExternal ? link : new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((c) => c.url === targetLink || c.url === self.location.origin + '/');
      if (matchingClient && !isExternal) {
        return matchingClient.focus().then(() => matchingClient.navigate(targetLink));
      }

      const fallbackClient = clientList.find((c) => 'focus' in c) || clientList[0];
      if (fallbackClient && !isExternal) {
        return fallbackClient.focus().then(() => fallbackClient.navigate(targetLink));
      }

      if ('openWindow' in self.clients) {
        return self.clients.openWindow(targetLink);
      }

      return null;
    })
  );
});


// Handle vibe song actions when app is in background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEDIA_SESSION_ACTION') {
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
