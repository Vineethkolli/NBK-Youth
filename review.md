## ERRORS

1. **Hardcoded URL in vite.config.js**
   - **File:** `frontend/vite.config.js:39`
   - **Issue:** `urlPattern: ({ url }) => url.origin === 'https://nbkyouth.vercel.app'`
   - **Impact:** Cache won't work properly in development or other environments
   - **Fix:** Use `import.meta.env.VITE_BACKEND_URL` or dynamic origin detection

2. **Memory Leak in MusicContext**
   - **File:** `frontend/src/context/MusicContext.jsx:66-97`
   - **Issue:** Audio element listeners not properly cleaned up if component unmounts during playback
   - **Severity:** Low
   - **Recommendation:** Add cleanup in main useEffect return

3. **Token Storage**
    - **File:** `frontend/src/context/AuthContext.jsx:14`
    - **Current:** Token stored in localStorage
    - **Recommendation:** Consider httpOnly cookies for better security (requires backend changes)

---

## 3. PWA, SERVICE WORKER, CACHE, NOTIFICATIONS REVIEW

### Issues & Recommendations

#### Service Worker

1. **Message Handler Scope**
   - **File:** `frontend/src/sw.js:33-53`
   - Only handles MEDIA_SESSION_ACTION messages
   - **Recommendation:** Add generic message handler for future extensibility

2. **Service Worker Registration**
   - **Files:** `frontend/src/utils/notifications.js:7`, `frontend/src/components/notifications/NotificationAutoRegister.jsx:48`
   - **Issue:** SW registered in multiple places
   - **Recommendation:** Single registration point in App.jsx or main.jsx

#### Caching

3. **Cache Size Limits**
   - **Missing:** No maximum cache size defined
   - **Recommendation:** Add cache expiration and size limits
   ```js
   options: {
     cacheName: 'api-cache',
     expiration: {
       maxEntries: 50,
       maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
     }
   }
   ```

#### Notifications

4. **Permission Handling**
   - **File:** `frontend/src/components/notifications/NotificationAutoRegister.jsx:13-14`
   - Only subscribes if permission already granted
   - **Missing:** No prompt to request permission
   - **Recommendation:** Add permission request flow

5. **Notification Click Routing**
   - **File:** `frontend/src/sw.js:27-28`
   - Always routes to `/notifications`
   - **Recommendation:** Make destination dynamic based on notification data
   ```js
   const url = event.notification.data?.url || '/notifications';
   event.waitUntil(clients.openWindow(url));
   ```

#### Background Sync

6. **Missing Background Sync**
    - **Not Implemented:** No background sync for offline actions
    - **Recommendation:** Add background sync for form submissions
    ```js
    // In sw.js
    self.addEventListener('sync', (event) => {
      if (event.tag === 'sync-forms') {
        event.waitUntil(syncForms());
      }
    });
    ```

7. **Offline Queue**
    - **Missing:** No queue for failed requests when offline
    - **Recommendation:** Implement workbox-background-sync

#### PWA Features

8. **Offline Indicator**
    - **Missing:** No visual indicator when app is offline
    - **Recommendation:** Add online/offline status indicator

### Background Sync Implementation Example

```javascript
// In sw.js
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

const bgSyncPlugin = new BackgroundSyncPlugin('formQueue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);
```

### Cache Strategy Improvements

```javascript
// In vite.config.js
workbox: {
  runtimeCaching: [
    {
      urlPattern: ({ url, request }) => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        return url.href.startsWith(apiUrl) && request.method === 'GET';
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets-cache-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache-v1',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
}
```