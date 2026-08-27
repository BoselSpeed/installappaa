import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { request as httpsRequest } from 'https'

const PROXY_PATH = '/__drive-proxy'

// Dev-server reverse proxy for archive downloads (Google Drive files).
// Browsers cannot fetch drive.usercontent.google.com directly (Google sends no
// Access-Control-Allow-Origin, so every cross-origin request is CORS-blocked).
// This same-origin proxy forwards Range/plain GETs server-side, so the archive
// downloads work in-app during local dev / sandbox previews. A production
// deployment needs the same tiny endpoint exposed (e.g. a serverless function).
const driveProxy = (): Plugin => ({
  name: 'drive-proxy',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost')
      if (url.pathname !== PROXY_PATH) return next()

      const target = url.searchParams.get('url')
      if (!target) {
        res.statusCode = 400
        res.end('Missing "url" parameter')
        return
      }

      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      }
      if (req.headers.range) headers.Range = req.headers.range as string

      let upstream
      try {
        upstream = httpsRequest(decodeURIComponent(target), {
          method: 'GET',
          headers,
        }, (up) => {
          if ([301, 302, 303, 307, 308].includes(up.statusCode || 0)) {
            res.statusCode = up.statusCode || 302
            res.setHeader('location', up.headers.location || '')
            res.end()
            upstream.destroy()
            return
          }
          res.statusCode = up.statusCode || 502
          res.setHeader('access-control-allow-origin', '*')
          res.setHeader('vary', 'Origin')
          for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition']) {
            const v = up.headers[h]
            if (v !== undefined) res.setHeader(h, String(v))
          }
          up.pipe(res)
        })
      } catch {
        res.statusCode = 502
        res.end('Invalid proxy URL')
        return
      }
      upstream.on('error', () => {
        if (!res.headersSent) {
          res.statusCode = 502
          res.end('Upstream error')
        }
      })
      req.on('close', () => upstream.destroy())
      upstream.end()
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    driveProxy(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'تطبيق الفقه',
        short_name: 'تطبيق الفقه',
        description: 'موسوعة كتب التوحيد والعقيدة — تعمل بدون إنترنت',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#000000',
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
    outDir: 'تطبيق الفقه',
    sourcemap: false,
    target: 'es2022',
  },
})
