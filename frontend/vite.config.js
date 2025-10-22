import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      manifest: {
        name: 'NBK Youth',
        short_name: 'NBK Youth',
        description: 'NBK Youth Gangavaram',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo/192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/logo/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ]
      },
      workbox: {
  runtimeCaching: [
    // API responses (NetworkFirst for live data, fallback to cache)
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // Images (CacheFirst for faster load)
    {
  urlPattern: ({ request }) => request.destination === 'image',
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'image-cache',
    expiration: {
      maxEntries: 60,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
    },
    cacheableResponse: { statuses: [0, 200] },
  },
},

    // Static assets (StaleWhileRevalidate for fast + updated)
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-cache',
      },
    },
  ],
},
    })
  ]
});
