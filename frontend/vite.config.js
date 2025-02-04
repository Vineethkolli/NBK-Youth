import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NBK Youth',
        short_name: 'NBK Youth',
        description: 'NBK Youth Gangavaram',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/?homescreen=1',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Cache API requests (example)
            urlPattern: ({ url }) => url.origin === 'https://nbkyouth.vercel.app',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
          {
            // Cache all same-origin assets
            urlPattern: ({ url }) => url.origin === location.origin,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
            },
          },
        ],
      },
    }),
  ],
});
