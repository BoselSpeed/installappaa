// Static server for the production web build, plus the download proxy the app
// needs on the web.
//
// Why this exists
// ---------------
// Volumes that are not bundled with the app live in remote ZIP archives on
// Google Drive. A browser cannot fetch them directly: Google sends no
// Access-Control-Allow-Origin header, and the `Range` header the reader needs
// triggers a CORS preflight. Vite's dev server already exposes
// `/__drive-proxy` (vite.config.ts), but `configureServer` hooks do not exist in
// a production bundle — so a plain static host leaves every archive download
// broken. This server closes that gap with no extra dependencies.
//
// It is not a production-grade server (no TLS, no caching headers beyond
// basics, single process). For a real deployment either run it behind a
// reverse proxy, or reimplement the same endpoint in your platform's function
// runtime — see docs/deployment.md.
//
// Usage:
//   npm run build
//   npm run serve              # http://localhost:4173
//   PORT=8080 npm run serve

import { createServer } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const WEB_DIR = process.env.WEB_DIR || 'تطبيق الفقه';
const WEB_ROOT = resolve(ROOT, WEB_DIR);
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
const PROXY_PATH = '/__drive-proxy';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

// Passes these through from the upstream archive host.
const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'content-disposition',
  'etag',
  'last-modified'
];

// Mirrors the dev-server proxy: forward the exact request server-side so Range
// headers and status codes survive, and answer with CORS-open headers.
const handleProxy = (req, res, target) => {
  const send = (code, message) => {
    if (res.headersSent) return;
    res.statusCode = code;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('vary', 'Origin');
    res.end(message);
  };

  if (!target) {
    send(400, 'Missing "url" parameter');
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    send(400, 'Malformed "url" parameter');
    return;
  }

  let parsed;
  try {
    parsed = new URL(decoded);
  } catch {
    send(400, 'Invalid proxy URL');
    return;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    send(400, 'Only http and https URLs can be proxied');
    return;
  }

  const headers = {
    // Google Drive rejects some clients outright, so send a browser UA.
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
  };
  if (req.headers.range) headers.Range = req.headers.range;
  if (req.headers['if-range']) headers['If-Range'] = req.headers['if-range'];

  const sendUpstream = httpsRequest(parsed, { method: 'GET', headers }, (up) => {
    const status = up.statusCode || 502;
    // Pass redirects through so the client can follow them itself.
    if ([301, 302, 303, 307, 308].includes(status)) {
      res.statusCode = status;
      res.setHeader('location', up.headers.location || '');
      res.setHeader('access-control-allow-origin', '*');
      up.resume();
      res.end();
      return;
    }
    res.statusCode = status;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('vary', 'Origin');
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = up.headers[name];
      if (value !== undefined) res.setHeader(name, String(value));
    }
    up.pipe(res);
  });

  sendUpstream.on('error', () => send(502, 'Upstream error'));
  // Stop pulling the archive if the browser aborts the range request.
  req.on('close', () => sendUpstream.destroy());
  sendUpstream.end();
};

// Serves a file with a single Range request; anything out of bounds falls back
// to the full body, which is all the PDF reader needs.
const serveFile = async (req, res, filePath) => {
  const stat = await fs.stat(filePath);
  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';

  const range = req.headers.range;
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (match) {
    const startRaw = match[1];
    const endRaw = match[2];
    let start;
    let end;

    if (startRaw === '') {
      // Suffix range: "bytes=-N" -> the final N bytes.
      const suffix = Number(endRaw);
      if (suffix > 0) {
        start = Math.max(0, stat.size - suffix);
        end = stat.size - 1;
      }
    } else {
      start = Number(startRaw);
      end = endRaw === '' ? stat.size - 1 : Math.min(Number(endRaw), stat.size - 1);
    }

    if (Number.isFinite(start) && Number.isFinite(end) && start >= 0 && start <= end && start < stat.size) {
      res.statusCode = 206;
      res.setHeader('content-type', type);
      res.setHeader('accept-ranges', 'bytes');
      res.setHeader('content-range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('content-length', end - start + 1);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.statusCode = 416;
    res.setHeader('content-range', `bytes */${stat.size}`);
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('content-type', type);
  res.setHeader('accept-ranges', 'bytes');
  res.setHeader('content-length', stat.size);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
};

const resolveStaticPath = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  // normalize() collapses "..", and the prefix check keeps every request inside
  // the build directory.
  const candidate = resolve(WEB_ROOT, `.${normalize(decoded)}`);
  if (candidate !== WEB_ROOT && !candidate.startsWith(WEB_ROOT + sep)) return null;
  return candidate;
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === PROXY_PATH) {
    handleProxy(req, res, url.searchParams.get('url'));
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat?.isFile()) {
      await serveFile(req, res, filePath);
      return;
    }
    if (stat?.isDirectory()) {
      const index = join(filePath, 'index.html');
      const indexStat = await fs.stat(index).catch(() => null);
      if (indexStat?.isFile()) {
        await serveFile(req, res, index);
        return;
      }
    }
  } catch (error) {
    console.error('Failed to serve', url.pathname, error);
    res.statusCode = 500;
    res.end('Internal Server Error');
    return;
  }

  // SPA fallback: unknown paths render the app shell. Note this is what the
  // client detects as "no proxy configured" when it hits /__drive-proxy, which
  // is exactly the behaviour we want to surface.
  const shell = join(WEB_ROOT, 'index.html');
  const shellStat = await fs.stat(shell).catch(() => null);
  if (!shellStat?.isFile()) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  await serveFile(req, res, shell);
});

try {
  await fs.access(WEB_ROOT);
} catch {
  console.error(`Web build not found at "${WEB_ROOT}".\nRun "npm run build" first, or set WEB_DIR.`);
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  console.log(`Serving ${WEB_DIR} on http://localhost:${PORT}`);
  console.log(`Download proxy available at ${PROXY_PATH}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server };
