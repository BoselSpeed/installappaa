// Range-based ZIP reader.
// Extracts a single member (a PDF) from a remote ZIP archive using HTTP
// Range requests only — the whole archive is never downloaded. This lets a
// book hosted as one ZIP on Google Drive (or any Range-capable server) offer
// per-volume downloads directly inside the app.
//
// Requires the server to support:
//   - HTTP Range requests (206 Partial Content)
//   - byte-suffix ranges ("bytes=-N") to read the end-of-central-directory
//
// Cross-origin considerations:
//   - Native app (Android/iOS): every request goes through CapacitorHttp, the
//     OS HTTP client, so there is no browser CORS and Google Drive accepts the
//     Range requests (they look like any normal download client).
//   - Web: the app is on a different origin than Google Drive, which sends no
//     Access-Control-Allow-Origin header, so direct fetches are CORS-blocked.
//     Those are retried through the same-origin proxy exposed by the dev server
//     (vite.config.ts) / any production backend.

import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { inflateSync } from 'fflate';

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;
const LH_SIG = 0x04034b50;

const u16 = (b, o) => (b[o] | (b[o + 1] << 8)) >>> 0;
const u32 = (b, o) =>
  (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

const decoders = {
  utf8: new TextDecoder('utf-8'),
  cp437: new TextDecoder('windows-1252')
};

const decodeName = (bytes, isUtf8) => {
  if (isUtf8) {
    const s = decoders.utf8.decode(bytes);
    if (!s.includes('\uFFFD')) return s;
  }
  return decoders.cp437.decode(bytes);
};

// Same-origin reverse proxy exposed by the dev server (see vite.config.ts) and
// by production backends. Used as a fallback when the archive host blocks
// cross-origin browser fetches (Google Drive sends no CORS headers).
const PROXY_PATH = '/__drive-proxy';
const proxiedUrl = (url) => `${PROXY_PATH}?url=${encodeURIComponent(url)}`;

const isNativeApp = () =>
  typeof Capacitor !== 'undefined' &&
  typeof Capacitor.getPlatform === 'function' &&
  Capacitor.getPlatform() !== 'web';

const decodeBase64 = (b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

// Executes one GET and returns { status, bytes }.
// - Native app: routed through CapacitorHttp (OS HTTP client), so no CORS.
// - Web: plain fetch; CORS blocks and 4xx responses are retried through the
//   same-origin proxy, which forwards the identical request server-side.
const rawGet = async (url, { headers = {} } = {}) => {
  if (isNativeApp()) {
    const res = await CapacitorHttp.request({
      url,
      method: 'GET',
      headers,
      responseType: 'arraybuffer',
    });
    const data =
      typeof res.data === 'string'
        ? decodeBase64(res.data)
        : new Uint8Array(res.data || []);
    return { status: res.status, bytes: data };
  }

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    // CORS/net failure: retry through the same-origin proxy. It forwards the
    // exact same request server-side, so Range headers and bodies pass through.
    res = await fetch(proxiedUrl(url), { headers });
  }
  if (res.status >= 400) {
    // Some hosts (Google Drive) reject browser requests with a 4xx. Retry
    // through the proxy before giving up.
    res = await fetch(proxiedUrl(url), { headers });
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { status: res.status, bytes };
};

// Fetches bytes [start..end] from url. Uses a byte-suffix range when start is
// negative. Returns a Uint8Array with exactly the requested bytes.
const fetchRange = async (url, start, end) => {
  const range =
    start < 0 ? `bytes=${start}` : `bytes=${start}-${end}`;
  const { status, bytes } = await rawGet(url, { headers: { Range: range } });
  if (status === 206) {
    return bytes;
  }
  if (status === 200) {
    return start < 0 ? bytes : bytes.slice(start, Math.min(end + 1, bytes.length));
  }
  throw new Error(`Range request failed (${status})`);
};

// Web only: streams a whole resource, retrying through the proxy on CORS/4xx.
const fetchStream = async (url, { headers = {} } = {}) => {
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    res = await fetch(proxiedUrl(url), { headers });
  }
  if (res.status >= 400) {
    res = await fetch(proxiedUrl(url), { headers });
  }
  return res;
};

const findEocd = (tail) => {
  for (let i = tail.length - 22; i >= 0; i--) {
    if (u32(tail, i) === EOCD_SIG) return i;
  }
  return -1;
};

const parseCentralDirectory = (cd) => {
  const entries = new Map();
  let p = 0;
  while (p + 46 <= cd.length && u32(cd, p) === CD_SIG) {
    const flags = u16(cd, p + 8);
    const method = u16(cd, p + 10);
    const csize = u32(cd, p + 20);
    const usize = u32(cd, p + 24);
    const nameLen = u16(cd, p + 28);
    const extraLen = u16(cd, p + 30);
    const commentLen = u16(cd, p + 32);
    const lho = u32(cd, p + 42);
    const name = decodeName(cd.slice(p + 46, p + 46 + nameLen), (flags & 0x800) !== 0);
    if (!entries.has(name)) {
      entries.set(name, { method, csize, usize, lho });
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
};

// Extracts one member (by exact path) from a remote ZIP.
// Reports progress (0-100) as compressed bytes are fetched.
export const extractZipMember = async (url, path, onProgress) => {
  if (!url || !path) {
    throw new Error('Missing ZIP archive URL or member path');
  }

  // 1. Read the end of the archive (covers EOCD + max comment length).
  const tail = await fetchRange(url, -65557);
  const eocdOffset = findEocd(tail);
  if (eocdOffset < 0) {
    throw new Error('Invalid ZIP archive (end record not found)');
  }

  // 2. Read the central directory to locate the member.
  const cdStart = u32(tail, eocdOffset + 16);
  const cdSize = u32(tail, eocdOffset + 12);
  const cd = await fetchRange(url, cdStart, cdStart + cdSize - 1);
  const entries = parseCentralDirectory(cd);
  const entry = entries.get(path);

  if (!entry) {
    throw new Error('Volume not found in archive');
  }
  if (entry.method !== 0 && entry.method !== 8) {
    throw new Error('Unsupported compression method');
  }

  // 3. Read the local header to find where the member data starts.
  const lh = await fetchRange(url, entry.lho, entry.lho + 29);
  if (lh.length < 30 || u32(lh, 0) !== LH_SIG) {
    throw new Error('Invalid ZIP local header');
  }
  const nameLen = u16(lh, 26);
  const extraLen = u16(lh, 28);
  const dataStart = entry.lho + 30 + nameLen + extraLen;
  const dataEnd = dataStart + entry.csize - 1;

  // 4. Stream the compressed data in chunks, reporting progress.
  const chunks = [];
  let received = 0;
  let lastReported = -1;
  const CHUNK = 1024 * 1024;
  for (let s = dataStart; s <= dataEnd; s += CHUNK) {
    const end = Math.min(dataEnd, s + CHUNK - 1);
    chunks.push(await fetchRange(url, s, end));
    received += end - s + 1;
    const percent = Math.min(99, Math.round((received / entry.csize) * 100));
    if (percent !== lastReported) {
      lastReported = percent;
      onProgress?.(percent);
    }
  }

  const compressed = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let off = 0;
  for (const c of chunks) {
    compressed.set(c, off);
    off += c.length;
  }

  const pdfBytes = entry.method === 8 ? inflateSync(compressed) : compressed;
  onProgress?.(100);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

// Fallback extraction used when HTTP Range requests (or their CORS preflight)
// are blocked by the hosting server. It downloads the whole archive once with
// a plain GET — no custom headers, so no preflight is needed — and extracts
// the requested member locally. Heavier than the Range path, but it keeps the
// download inside the app anywhere the archive itself can be fetched.
export const extractZipMemberWhole = async (url, path, onProgress) => {
  if (!url || !path) {
    throw new Error('Missing ZIP archive URL or member path');
  }

  let data;
  if (isNativeApp()) {
    // CapacitorHttp buffers the whole response; no incremental progress.
    const { bytes } = await rawGet(url);
    data = bytes;
    onProgress?.(100);
  } else {
    const response = await fetchStream(url);
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }
    if (!response.body) {
      data = new Uint8Array(await response.arrayBuffer());
    } else {
      const reader = response.body.getReader();
      const chunks = [];
      let lastReported = -1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        const percent = Math.min(99, Math.round((chunks.length / 40) * 100));
        if (percent !== lastReported) {
          lastReported = percent;
          onProgress?.(percent);
        }
      }
      data = new Uint8Array(
        chunks.reduce((a, c) => a + c.length, 0)
      );
      let off = 0;
      for (const c of chunks) {
        data.set(c, off);
        off += c.length;
      }
    }
  }

  const eocdOffset = findEocd(data);
  if (eocdOffset < 0) {
    throw new Error('Invalid ZIP archive (end record not found)');
  }

  const cdStart = u32(data, eocdOffset + 16);
  const cdSize = u32(data, eocdOffset + 12);
  if (cdStart + cdSize > data.length) {
    throw new Error('Invalid ZIP archive (central directory out of range)');
  }
  const entries = parseCentralDirectory(data.slice(cdStart, cdStart + cdSize));
  const entry = entries.get(path);

  if (!entry) {
    throw new Error('Volume not found in archive');
  }
  if (entry.method !== 0 && entry.method !== 8) {
    throw new Error('Unsupported compression method');
  }

  if (entry.lho + 30 > data.length || u32(data, entry.lho) !== LH_SIG) {
    throw new Error('Invalid ZIP local header');
  }
  const nameLen = u16(data, entry.lho + 26);
  const extraLen = u16(data, entry.lho + 28);
  const dataStart = entry.lho + 30 + nameLen + extraLen;
  const dataEnd = dataStart + entry.csize;
  if (dataEnd > data.length) {
    throw new Error('Invalid ZIP member data');
  }

  const compressed = data.slice(dataStart, dataEnd);
  const pdfBytes = entry.method === 8 ? inflateSync(compressed) : compressed;
  onProgress?.(100);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export default { extractZipMember, extractZipMemberWhole };
