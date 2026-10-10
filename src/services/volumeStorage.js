// Local storage for downloaded book volumes.
// Downloaded PDFs are stored in IndexedDB so they can be opened again
// offline without re-downloading. Deleting a volume only removes the local
// PDF blob — the book and its information are never touched.
//
// On Android the transfer is handed to the native downloader instead
// (see src/lib/nativeLibraryDownload.js). That matters because every remote
// PDF here is hosted on Google Drive, which sends no CORS headers, so a
// WebView fetch() can never succeed for them.

import {
  downloadVolumeNatively,
  hasLocalVolume,
  isNativeDownloadAvailable,
  nativeVolumeUrl,
  removeNativeVolume,
  resolveDownloadUrl
} from '../lib/nativeLibraryDownload';

/**
 * Error code for a cross-origin host that refuses to be fetched by the browser
 * (Google Drive sends no CORS headers). The UI turns this into an
 * "open in browser" link instead of a dead-end error.
 */
export const DOWNLOAD_BLOCKED = 'download_blocked';

/**
 * Error code for a transfer that reached the network but failed (host refused,
 * connection lost, archive entry missing). Distinct from DOWNLOAD_BLOCKED,
 * which means the browser forbade the request before it started.
 */
export const DOWNLOAD_FAILED = 'download_failed';

/**
 * Where a volume's PDF can be read from, in order of preference:
 *
 *  1. `downloadUrl` — a direct link, when the host serves CORS headers.
 *  2. `pdfUrl` — a PDF bundled with the app.
 *  3. `book.source.pageUrl` — the archive's own viewer page, offered as a
 *     last resort for books whose volumes live in a remote ZIP.
 *
 * There is no storage backend to resolve against: a static site cannot fetch
 * another origin's files, so anything not bundled has to be opened by the
 * host's own viewer rather than downloaded into the app.
 */
export const resolveVolumeUrl = (volume, book) => {
  if (!volume) return null;
  if (volume.downloadUrl) return volume.downloadUrl;
  if (volume.pdfUrl) return volume.pdfUrl;
  if (book?.source?.pageUrl) return book.source.pageUrl;
  return null;
};

/**
 * Whether the app itself can display a volume. Only bundled PDFs can: they are
 * served from the same origin as the app, so the web reader can open them.
 * Everything else lives on another host, which a static deployment cannot
 * fetch.
 */
export const canReadInApp = (volume) => Boolean(volume?.bundled || volume?.pdfUrl);

/**
 * Whether the app can download a volume onto the device.
 *
 * Bundled volumes ship with the app, so there is nothing to fetch. Everything
 * else needs the native downloader: on Android that works for both plain Drive
 * PDFs and volumes inside a Drive archive, while on the web the same files are
 * unreachable and the volume has to be opened at its source instead.
 */
export const canDownloadVolume = (volume) =>
  Boolean(volume && !volume.bundled && !volume.pdfUrl && isNativeDownloadAvailable());

const DB_NAME = 'fiqh-app';
const DB_VERSION = 1;
const STORE = 'volumes';

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const recordId = (bookId, volumeId) => `${bookId}:${volumeId}`;

// Returns the stored Blob for a volume, or null when it has not been
// downloaded (or the browser does not support IndexedDB).
export const getStoredVolumeBlob = async (bookId, volumeId) => {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(recordId(bookId, volumeId));
      req.onsuccess = () => {
        const record = req.result;
        resolve(record && record.blob ? record.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error reading stored volume:', error);
    return null;
  }
};

// Creates an object URL for a stored volume PDF (caller revokes it when done).
export const getStoredVolumeBlobUrl = async (bookId, volumeId) => {
  const blob = await getStoredVolumeBlob(bookId, volumeId);
  return blob ? URL.createObjectURL(blob) : null;
};

/**
 * Resolve where a volume the app can actually read is served from.
 *
 * Shared by the reader page and the table-of-contents preview so both follow
 * the same order: a bundled file first, then a copy held in IndexedDB, then a
 * file the native downloader put on the device.
 *
 * @param {string} bookId
 * @param {string} volumeId
 * @param {{bundled?:boolean, pdfUrl?:string}} volume
 * @returns {Promise<{url:string, revoke:string|null}|null>}
 *   `revoke` is the object URL to release once the PDF has been read into
 *   memory; null when the URL does not belong to the caller to revoke.
 */
export const resolveReadableVolumeUrl = async (bookId, volumeId, volume) => {
  if (volume?.bundled && volume.pdfUrl) {
    return { url: volume.pdfUrl, revoke: null };
  }

  const blobUrl = await getStoredVolumeBlobUrl(bookId, volumeId);
  if (blobUrl) {
    return { url: blobUrl, revoke: blobUrl };
  }

  if (isNativeDownloadAvailable()) {
    const url = await nativeVolumeUrl(bookId, volumeId);
    if (url) {
      return { url, revoke: null };
    }
  }

  return null;
};

export const isVolumeStored = async (bookId, volumeId) => {
  // The native store and the IndexedDB store are alternatives, never both: a
  // volume downloaded in the app never also lands in IndexedDB.
  if (await hasLocalVolume(bookId, volumeId)) return true;
  return (await getStoredVolumeBlob(bookId, volumeId)) !== null;
};

export const storeVolume = async (bookId, volumeId, blob) => {
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id: recordId(bookId, volumeId),
      bookId,
      volumeId,
      blob,
      storedAt: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const removeStoredVolume = async (bookId, volumeId) => {
  // Clear both stores: a volume may have been fetched natively on Android and
  // left behind in IndexedDB by an earlier build.
  await removeNativeVolume(bookId, volumeId).catch(() => undefined);
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(recordId(bookId, volumeId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Downloads a volume PDF and persists it locally. Reports progress (0-100)
// through onProgress.
//
// Only a host that serves CORS headers can be fetched from a static site, so a
// volume in a remote ZIP cannot be pulled out of the archive here — the archive
// is opened through its own viewer instead.
export const downloadVolume = async (book, volume, onProgress) => {
  // On Android the native downloader owns the transfer: it has no CORS
  // restriction, so Drive-hosted files actually arrive.
  if (isNativeDownloadAvailable() && !volume?.pdfUrl) {
    const url = resolveDownloadUrl(volume, book);
    if (!url) throw new Error('No download URL available for this volume');
    try {
      return await downloadVolumeNatively({ book, volume, onProgress });
    } catch (error) {
      // Surface something the UI can translate, rather than a raw platform
      // message that would only ever show as an English string in an Arabic
      // interface.
      console.error('Native download failed:', error);
      throw new Error(DOWNLOAD_FAILED);
    }
  }

  const url = resolveVolumeUrl(volume, book);
  if (!url) {
    throw new Error('No download URL available for this volume');
  }

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    // A plain fetch to a cross-origin host without CORS headers throws here.
    console.warn('Direct download blocked by the browser:', error);
    throw new Error(DOWNLOAD_BLOCKED);
  }
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const contentLength = Number(response.headers.get('Content-Length')) || 0;

  if (!response.body) {
    const blob = await response.blob();
    onProgress?.(100);
    await storeVolume(book.id, volume.id, blob);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  let lastReported = -1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    let percent = 0;
    if (contentLength > 0) {
      percent = Math.min(99, Math.round((received / contentLength) * 100));
    } else {
      percent = Math.min(99, Math.round((chunks.length / 40) * 100));
    }
    if (percent !== lastReported) {
      lastReported = percent;
      onProgress?.(percent);
    }
  }

  const blob = new Blob(chunks, { type: 'application/pdf' });
  onProgress?.(100);
  await storeVolume(book.id, volume.id, blob);
  return blob;
};

export const storedVolumeSizeMb = async (bookId, volumeId) => {
  const blob = await getStoredVolumeBlob(bookId, volumeId);
  return blob ? Math.round((blob.size / (1024 * 1024)) * 10) / 10 : null;
};

export default {
  getStoredVolumeBlob,
  getStoredVolumeBlobUrl,
  resolveReadableVolumeUrl,
  isVolumeStored,
  storeVolume,
  removeStoredVolume,
  downloadVolume,
  storedVolumeSizeMb,
  resolveVolumeUrl,
  canReadInApp,
  canDownloadVolume,
  DOWNLOAD_BLOCKED,
  DOWNLOAD_FAILED
};
