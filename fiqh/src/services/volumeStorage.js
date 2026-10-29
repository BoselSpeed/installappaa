// Local storage for downloaded book volumes.
// Downloaded PDFs are stored in IndexedDB so they can be opened again
// offline without re-downloading. Deleting a volume only removes the local
// PDF blob — the book and its information are never touched.
//
// On Android the transfer is handed to the native downloader instead
// (see src/lib/nativeLibraryDownload.js). That matters because remote PDFs on
// Google Drive send no CORS headers, so a WebView fetch() can never succeed
// for them. Books hosted on Internet Archive (source type "archive") can be
// downloaded on the web as well, through archive.org's CORS-enabled `/cors/`
// endpoint, and are stored in IndexedDB like any other fetched blob.
//
// Optimizations:
// - Parallel segmented downloads using Range requests for archive.org (web)
// - 4 concurrent segments for files > 5 MB
// - Better progress reporting with byte accuracy
// - Retry logic with exponential backoff

import {
  downloadVolumeNatively,
  hasLocalVolume,
  isNativeDownloadAvailable,
  nativeVolumeUrl,
  removeNativeVolume,
  resolveCorsDownloadUrl,
  resolveDownloadUrl
} from '../lib/nativeLibraryDownload';

export const DOWNLOAD_BLOCKED = 'download_blocked';
export const DOWNLOAD_FAILED = 'download_failed';

export const resolveVolumeUrl = (volume, book) => {
  if (!volume) return null;
  if (volume.downloadUrl) return volume.downloadUrl;
  if (volume.pdfUrl) return volume.pdfUrl;
  if (book?.source?.type === 'archive') {
    if (book?.source?.identifier) return `https://archive.org/details/${book.source.identifier}`;
    return null;
  }
  if (book?.source?.pageUrl) return book.source.pageUrl;
  return null;
};

export const canReadInApp = (volume) => Boolean(volume?.bundled || volume?.pdfUrl);

export const canDownloadVolume = (volume, book) =>
  Boolean(
    volume &&
      !volume.bundled &&
      !volume.pdfUrl &&
      (isNativeDownloadAvailable() || book?.source?.type === 'archive')
  );

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

export const getStoredVolumeBlobUrl = async (bookId, volumeId) => {
  const blob = await getStoredVolumeBlob(bookId, volumeId);
  return blob ? URL.createObjectURL(blob) : null;
};

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
  await removeNativeVolume(bookId, volumeId).catch(() => undefined);
  const db = await openDB();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(recordId(bookId, volumeId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Download a single segment with retry logic
 */
const downloadSegment = async (url, start, end, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        // Don't use cache for partial content
        cache: 'no-store'
      });
      if (!response.ok && response.status !== 206) {
        throw new Error(`Segment ${start}-${end} failed: ${response.status}`);
      }
      const blob = await response.blob();
      return { start, end, blob, size: blob.size };
    } catch (error) {
      if (attempt === retries) throw error;
      // Exponential backoff: 500ms, 1s, 2s
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
};

/**
 * Parallel segmented download using Range requests
 * Only works for hosts that support CORS + Range (archive.org /cors/ endpoint)
 */
const downloadParallel = async (url, fileSize, onProgress, concurrency = 4) => {
  const segmentSize = Math.ceil(fileSize / concurrency);
  const segments = [];
  
  for (let i = 0; i < concurrency; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize - 1, fileSize - 1);
    if (start <= end) segments.push({ start, end });
  }

  const results = [];
  let completed = 0;
  let totalReceived = 0;
  let lastReported = -1;

  // Download segments in batches of concurrency
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency);
    const promises = batch.map(seg => 
      downloadSegment(url, seg.start, seg.end).then(result => {
        results[segments.indexOf(seg)] = result;
        completed++;
        totalReceived += result.size;
        
        if (onProgress && fileSize > 0) {
          const percent = Math.min(99, Math.round((totalReceived / fileSize) * 100));
          if (percent !== lastReported) {
            lastReported = percent;
            onProgress(percent);
          }
        }
        return result;
      })
    );
    
    await Promise.all(promises);
  }

  // Merge blobs in order
  const orderedBlobs = results
    .sort((a, b) => a.start - b.start)
    .map(r => r.blob);
  
  return new Blob(orderedBlobs, { type: 'application/pdf' });
};

/**
 * Single-stream download fallback
 */
const downloadSingle = async (url, fileSize, onProgress) => {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.warn('Direct download blocked by the browser:', error);
    throw new Error(DOWNLOAD_BLOCKED);
  }
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const contentLength = Number(response.headers.get('Content-Length')) || fileSize;

  if (!response.body) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  let lastReported = -1;

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

  return new Blob(chunks, { type: 'application/pdf' });
};

/**
 * Get file size with HEAD request
 */
const getFileSize = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (response.ok) {
      const len = response.headers.get('Content-Length');
      return len ? parseInt(len, 10) : 0;
    }
  } catch {}
  return 0;
};

// Downloads a volume PDF and persists it locally. Reports progress (0-100)
// through onProgress.
export const downloadVolume = async (book, volume, onProgress) => {
  // On Android the native downloader owns the transfer: it has no CORS
  // restriction, so Drive-hosted and archive.org files actually arrive.
  if (isNativeDownloadAvailable() && !volume?.pdfUrl) {
    const url = resolveDownloadUrl(volume, book);
    if (!url) throw new Error('No download URL available for this volume');
    try {
      return await downloadVolumeNatively({ book, volume, onProgress });
    } catch (error) {
      console.error('Native download failed:', error);
      throw new Error(DOWNLOAD_FAILED);
    }
  }

  // Web download - only works for archive.org with CORS
  if (book?.source?.type === 'archive') {
    const url = resolveCorsDownloadUrl(volume, book);
    if (!url) throw new Error('No download URL available for this volume');

    // Get file size first
    const fileSize = await getFileSize(url);
    
    // Use parallel download for files > 5 MB
    const useParallel = fileSize > 5 * 1024 * 1024;
    
    let blob;
    if (useParallel) {
      blob = await downloadParallel(url, fileSize, onProgress, 4);
    } else {
      blob = await downloadSingle(url, fileSize, onProgress);
    }

    onProgress?.(100);
    await storeVolume(book.id, volume.id, blob);
    return blob;
  }

  // Other hosts (Drive) - not supported on web due to CORS
  const url = resolveVolumeUrl(volume, book);
  if (!url) throw new Error('No download URL available for this volume');
  
  try {
    const blob = await downloadSingle(url, 0, onProgress);
    await storeVolume(book.id, volume.id, blob);
    return blob;
  } catch (error) {
    if (error.message === DOWNLOAD_BLOCKED) throw error;
    throw new Error(DOWNLOAD_FAILED);
  }
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
