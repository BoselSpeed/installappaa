# Deployment

The web build is a static bundle in `تطبيق الفقه/`, but it is **not** enough on
its own. This page explains the one endpoint it needs, then lists the ways to
host it.

## The problem

Volume PDFs are large, so only eight of them ship inside the bundle
(`public/books/`, ~36 MB). The rest of the library lives in remote ZIP archives
on Google Drive. `src/services/zipRangeReader.js` reads a single PDF out of such
an archive using HTTP `Range` requests — it fetches the end-of-central-directory
record, then the central directory, then just the bytes of the volume the reader
tapped. The whole archive is never downloaded.

Two things stop that from working in a browser:

1. **CORS.** Google Drive sends no `Access-Control-Allow-Origin` header, so a
   cross-origin `fetch` from the app is blocked.
2. **Preflight.** `Range` is not a CORS-safelisted request header, so the browser
   sends an `OPTIONS` preflight first, which Drive does not answer.

The Android build avoids both because `CapacitorHttp` (enabled in
`capacitor.config.json`) sends every request through the OS HTTP client, where
there is no browser CORS at all.

A browser needs a same-origin endpoint that forwards the request server-side.
That endpoint is `/__drive-proxy?url=<encoded absolute url>`.

## Contract

| | |
|---|---|
| Path | `/__drive-proxy` |
| Query | `url` — the absolute `https://` URL to fetch (required) |
| Request headers to forward | `Range`, `If-Range` |
| Response headers to return | `status`, `Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges`, `Content-Disposition` |
| Redirects | pass `3xx` + `Location` through rather than following |
| Other | set `Access-Control-Allow-Origin: *` |

It must stream the upstream body, not buffer it — archives run to hundreds of
megabytes.

## Option 1 — the bundled server (fastest)

`server/serve.mjs` implements exactly this contract with no dependencies, plus
Range-capable static file serving for the build and an SPA fallback.

```bash
npm install
npm run build
npm run serve                      # http://localhost:4173

PORT=8080 HOST=127.0.0.1 npm run serve
WEB_DIR=some-other-dir npm run serve
```

Put it behind nginx/Caddy for TLS. It is a small single-process server: fine for
a handful of readers, not a hardened public service.

## Option 2 — a serverless function

Any host that runs functions works; translate `server/serve.mjs`'s
`handleProxy` into its request/response API. The only parts that matter are
forwarding `Range` and streaming the body.

<details>
<summary>Vercel (<code>api/drive-proxy.js</code>)</summary>

```js
export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  const target = new URL(req.url, 'http://x').searchParams.get('url');
  if (!target) return res.status(400).send('Missing "url" parameter');

  const upstream = await fetch(target, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      ...(req.headers.range ? { Range: req.headers.range } : {})
    },
    redirect: 'manual'
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    res.setHeader('Location', upstream.headers.get('location') || '');
    return res.status(upstream.status).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  for (const name of [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'content-disposition'
  ]) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  res.status(upstream.status);
  res.send(Buffer.from(await upstream.arrayBuffer()));
}
```

</details>

<details>
<summary>nginx</summary>

```nginx
location /__drive-proxy {
    proxy_pass https://drive.usercontent.google.com;
    proxy_set_header Host drive.usercontent.google.com;
    proxy_set_header Range $http_range;
    proxy_set_header If-Range $http_if_range;
    proxy_set_header User-Agent $http_user_agent;
    proxy_force_ranges on;
    proxy_buffering off;
    add_header Access-Control-Allow-Origin "*" always;
}
```

`proxy_force_ranges on` makes nginx honour upstream `206` responses;
`proxy_buffering off` stops it from buffering a whole archive in memory.

</details>

<details>
<summary>Cloudflare Worker</summary>

```js
export default {
  async fetch(request) {
    const target = new URL(request.url).searchParams.get('url');
    if (!target) return new Response('Missing "url" parameter', { status: 400 });

    const headers = new Headers({ 'User-Agent': request.headers.get('user-agent') || '' });
    const range = request.headers.get('range');
    if (range) headers.set('Range', range);

    const upstream = await fetch(target, { headers, redirect: 'manual' });
    const out = new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': upstream.headers.get('content-length') || '',
        'Content-Range': upstream.headers.get('content-range') || '',
        'Accept-Ranges': upstream.headers.get('accept-ranges') || 'bytes'
      }
    });
    return out;
  }
};
```

</details>

## Option 3 — move the archives somewhere CORS-friendly

If you can host the ZIPs yourself, this removes the need for a proxy entirely:
supabase, R2, Cloud Storage and nginx all support `Range` and can be configured
to send `Access-Control-Allow-Origin`.

Give the book a direct URL instead of a ZIP member:

```js
// src/data/books.js
{
  id: 'sahih-al-bukhari',
  volumes: [
    { id: 'v2', number: 2, bundled: false, downloadUrl: 'https://cdn.example.com/bukhari/v2.pdf' }
  ]
}
```

or a `storagePath` on a public Supabase bucket:

```js
{ id: 'v2', number: 2, bundled: false, storagePath: 'books/sahih-al-bukhari/v2.pdf' }
```

See `docs/books-management.md` for the full field reference.

## When it is missing

If the app is served without the proxy, archive downloads fail on the web. The
app detects this — the SPA fallback answers `/__drive-proxy` with `text/html`,
which `zipRangeReader` recognises — and instead of a dead-end retry button the
volume card explains the situation and offers the original archive link. Nothing
crashes; bundled volumes keep working.

## Building the Android app

```bash
npm run android:apk     # -> release/تطبيق-الفقه.apk
```

The APK embeds the web bundle, so rebuild the web app before syncing.

## Notes

- The service worker precaches everything in `public/books/` (8 PDFs, ~36 MB)
  and caches other `/books/*.pdf` requests first, with `rangeRequests: enabled`
  so partial PDF reads still work offline.
- Set `Content-Length` on proxied responses — the client uses it to report
  download progress.
- Serve the build over HTTPS: the app registers a service worker, which
  browsers only allow on secure origins.
