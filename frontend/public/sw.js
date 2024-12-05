self.addEventListener('push', (event) => {
    const options = event.data.json();
    event.waitUntil(
      self.registration.showNotification(options.title, {
        ...options,
        icon: options.icon || '/logo.png',
        badge: options.badge || '/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'Open'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      })
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    if (event.action === 'close') {
      return;
    }
  
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        const hadWindowToFocus = clientList.some((client) => {
          if (client.url === '/notifier') {
            return client.focus();
          }
          return false;
        });
  
        if (!hadWindowToFocus) {
          clients.openWindow('/notifier').then((windowClient) => windowClient?.focus());
        }
      })
    );
  });