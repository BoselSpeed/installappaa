import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'fiqh',
        short_name: 'fiqh',
        description: 'fiqh — مكتبة كتب إسلامية، تعمل بدون إنترنت',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        // Matched to the light theme's paper and ink tokens in index.css. The
        // splash screen is drawn before the app can read the saved theme, so
        // this is the light appearance; the theme itself only applies once the
        // document is live.
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,ico,jpg,jpeg,png,svg,webmanifest,pdf}'],
        globIgnores: ['**/*.map'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/books\/.*\.pdf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fiqh-books',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              rangeRequests: true
            }
          },
          {
            // Covers for the imported archive.org library are served straight
            // from archive.org; cache them so the grid still renders offline.
            urlPattern: /^https:\/\/archive\.org\/(services\/img|download)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fiqh-archive-images',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    host: true,
    port: 3000,
    open: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  build: {
    outDir: 'fiqh-build',
    sourcemap: false,
    target: 'es2022',
  },
})
