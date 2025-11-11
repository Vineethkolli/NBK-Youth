import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

precacheAndRoute(self.__WB_MANIFEST || [])

// Add offline page to precache (important)
precacheAndRoute([{ url: '/offline.html', revision: null }])

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ✅ Offline navigation handling
const offlineHandler = createHandlerBoundToURL('/offline.html')
const navigationRoute = new NavigationRoute(async (options) => {
  try {
    // Try normal response first
    return await fetch(options.event.request)
  } catch {
    // Fallback to cached offline page
    return await caches.match('/offline.html')
  }
})
registerRoute(navigationRoute)

// ✅ Existing notification and media logic (keep your original below)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'NBK Youth'
  const options = {
    body: data.body || 'Default message',
    icon: '/logo/192.png',
    badge: '/logo/notificationlogo.png',
    requireInteraction: true,
    data: { link: data.link },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/notifications'
  const isExternal = link.startsWith('http')
  const targetLink = isExternal ? link : new URL(link, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((c) => 'focus' in c) || clientList[0]
      if (client && !isExternal) return client.focus().then(() => client.navigate(targetLink))
      else return self.clients.openWindow(targetLink)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MEDIA_SESSION_ACTION') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0]
          client.focus()
          client.postMessage({
            type: 'NAVIGATE_TO_VIBE',
            action: event.data.action,
          })
        } else {
          self.clients.openWindow('/vibe')
        }
      })
    )
  }
})
