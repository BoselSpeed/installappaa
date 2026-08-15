// Local storage for downloaded book volumes.
// Downloaded PDFs are stored in IndexedDB so they can be opened again
// offline without re-downloading. Deleting a volume only removes the local
// PDF blob — the book and its information are never touched.

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
// through onProgress. Uses the volume's downloadUrl for non-bundled volumes.
export const downloadVolume = async (book, volume, onProgress) => {
  const url = volume.downloadUrl || volume.pdfUrl;
  if (!url) {
    throw new Error('No download URL available for this volume');
  }

  const response = await fetch(url);
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
  storedVolumeSizeMb
};
