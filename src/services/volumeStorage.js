// Local storage for downloaded book volumes.
// Downloaded PDFs are stored in IndexedDB so they can be opened again
// offline without re-downloading. Deleting a volume only removes the local
// PDF blob — the book and its information are never touched.

/**
 * Error code for a cross-origin host that refuses to be fetched by the browser
 * (Google Drive sends no CORS headers). The UI turns this into an
 * "open in browser" link instead of a dead-end error.
 */
export const DOWNLOAD_BLOCKED = 'download_blocked';

/**
 * Where a volume's PDF can be read from, in order of preference:
 *
 *  1. `downloadUrl` — a direct link, when the host serves CORS headers.
 *  2. `pdfUrl` — a PDF bundled with the app, which is the only kind that can
 *     also open in the native reader.
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
 * served from the same origin as the app, so both the web reader and the
 * native reader can open them. Everything else lives on another host, which a
 * static deployment cannot fetch.
 */
export const canReadInApp = (volume) => Boolean(volume?.bundled || volume?.pdfUrl);

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

export const isVolumeStored = async (bookId, volumeId) =>
  (await getStoredVolumeBlob(bookId, volumeId)) !== null;

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
  isVolumeStored,
  storeVolume,
  removeStoredVolume,
  downloadVolume,
  storedVolumeSizeMb,
  resolveVolumeUrl,
  canReadInApp,
  DOWNLOAD_BLOCKED
};
