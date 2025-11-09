import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression' // ✅ Add this line

export default defineConfig({
  plugins: [
    react(),

    // ✅ Compression plugin
    viteCompression({
      algorithm: 'brotliCompress', // best compression (can change to 'gzip' if needed)
      ext: '.br',                  // file extension for compressed files
      threshold: 1024,             // only compress files > 1 KB
      deleteOriginFile: false,     // keep original files too
    }),

    // ✅ PWA plugin
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
            purpose: 'any maskable'
          },
          {
            src: '/logo/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true, // ✅ removes old caches on update
        clientsClaim: true,          // ✅ activates new SW immediately
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache' }
          }
        ]
      }
    })
  ],

  // ✅ Optional performance tweaks
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  }
})
