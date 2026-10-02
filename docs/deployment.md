# Deployment

The build is a static bundle in `تطبيق الفقه/`. Copy it to a static host and you
are done — there is no server-side code, no database, and no API keys.

## What gets deployed

```bash
npm install
npm run build          # -> تطبيق الفقه/
```

The output directory is self-contained: HTML, JS, CSS, the service worker, and
every PDF under `public/books/`. Anything that serves files over HTTP will work
— Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3 + CloudFront, or plain
nginx.

Preview it locally with `npm run preview`.

Two things to configure on the host:

- **SPA fallback.** Any unknown path must return `index.html`, so client-side
  routes like `/books/kitab-al-tawhid` work on a hard refresh.
- **HTTPS.** The app registers a service worker, and browsers only allow that on
  a secure origin.

For the Android app, no host is involved at all: the APK embeds the same bundle,
so rebuild the web app before syncing Capacitor.

```bash
npm run android:apk     # -> release/تطبيق-الفقه.apk
```

## Which volumes are readable in the app

Only PDFs bundled under `public/books/` are served from the app's own origin.
Those open in the web reader, in the Android reader, and offline.

Volumes hosted elsewhere are not downloadable, and this is a browser limit rather
than a missing feature:

- **Google Drive sends no `Access-Control-Allow-Origin`**, so a cross-origin
  `fetch` is blocked outright.
- **`Range` is not a CORS-safelisted header**, so a partial read also triggers an
  `OPTIONS` preflight that Drive does not answer.

There is no way around either from a static bundle — it would need a server to
forward the request, which is exactly what this build no longer ships. So the app
does not pretend otherwise: a volume that is not bundled is shown with an
*Opens in browser* badge and a link to its original location.

To make more volumes readable in the app, bundle them:

```js
// src/data/books.js
{
  id: 'sahih-al-bukhari',
  volumes: [
    { id: 'v2', number: 2, title_ar: 'الجزء الثاني', bundled: true, pdfUrl: '/books/bukhari-v2.pdf' }
  ]
}
```

Put the file in `public/books/` and run `npm run verify:content` to confirm it
was found. See `docs/books-management.md` for the full field reference.

## Service worker

The generated `sw.js` precaches the app shell and everything in
`public/books/`, so bundled books open with no network at all. It also caches
`/books/*.pdf` requests first with `rangeRequests: enabled`, which keeps partial
PDF reads working when a large book is only partly downloaded.

If you raise the bundled library size, raise
`maximumFileSizeToCacheInBytes` in `vite.config.ts` to match.