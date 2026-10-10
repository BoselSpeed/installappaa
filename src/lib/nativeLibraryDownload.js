// JavaScript side of the book downloader.
//
// Every remote PDF in this library is hosted on Google Drive, which sends no
// Access-Control-Allow-Origin header. From the WebView a fetch() is rejected
// before any bytes arrive, which is why the download button used to do nothing
// at all: there was no error to show and no way to recover.
//
// Native Android code has no such restriction, so the transfer runs through the
// `LibraryDownload` plugin instead. On the web the plugin does not exist and
// every helper here reports that plainly, letting callers fall back to opening
// the file at its original location.

import { Capacitor, registerPlugin } from '@capacitor/core';

/** Native proxy. Never throws on import; calls reject at runtime on web. */
const LibraryDownload = registerPlugin('LibraryDownload');

/** True only inside the native Android shell with the plugin present. */
export const isNativeDownloadAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/** Whether this volume's PDF sits inside a ZIP archive rather than alone. */
export const isArchiveVolume = (volume) =>
  Boolean(volume && !volume.pdfUrl && !volume.downloadUrl && volume.path);

/**
 * The direct-download URL for a book or volume.
 *
 * Books published as a single archive keep that archive in `source.pageUrl`,
 * which points at Drive's HTML viewer; the download endpoint is derived from
 * the same file id.
 */
export const resolveDownloadUrl = (volume, book) => {
  if (!volume) return null;
  if (volume.downloadUrl) return volume.downloadUrl;
  if (volume.pdfUrl) return null; // bundled: ships with the app, nothing to fetch

  const pageUrl = book?.source?.pageUrl;
  if (!pageUrl) return null;

  // /file/d/<ID>/view -> the /download?id=<ID> endpoint.
  const match = String(pageUrl).match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return pageUrl;
  return `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`;
};

/**
 * Stable key used for a volume's file on the device.
 *
 * Volume ids repeat across books — `v1` alone appears eighteen times in
 * `books.js` — so the book id has to be part of the key or different books
 * would overwrite each other's files.
 */
const volumeKey = (bookId, volumeId) => `${bookId}__${volumeId}`;

/**
 * Whether the device already holds this volume.
 *
 * Falls back to false on web, where nothing is stored natively.
 */
export const hasLocalVolume = async (bookId, volumeId) => {
  if (!isNativeDownloadAvailable()) return false;
  try {
    const result = await LibraryDownload.hasVolume({ volumeId: volumeKey(bookId, volumeId) });
    return Boolean(result?.present);
  } catch {
    return false;
  }
};

/**
 * Fetch a book and make one of its volumes available offline.
 *
 * For a plain PDF the file is stored as-is. For a book published as a ZIP the
 * archive is downloaded once (and reused on every later volume) and the single
 * volume is extracted from it.
 *
 * @param {object} options
 * @param {object} options.book    Book record, used for its archive URL.
 * @param {object} options.volume  Volume record.
 * @param {(percent:number)=>void} [options.onProgress]
 * @returns {Promise<{path:string}>} the on-device file for the volume.
 */
export const downloadVolumeNatively = async ({ book, volume, onProgress }) => {
  if (!isNativeDownloadAvailable()) {
    throw new Error('downloads are only available in the Android app');
  }

  const url = resolveDownloadUrl(volume, book);
  if (!url) throw new Error('this volume has no download location');

  const volumeId = volumeKey(book.id, volume.id);
  const archive = isArchiveVolume(volume);

  // Already extracted by an earlier download of the same volume.
  const existing = await LibraryDownload.hasVolume({ volumeId });
  if (existing?.present) {
    onProgress?.(100);
    return { path: existing.path };
  }

  // Watch progress for this book for the duration of the transfer.
  let listener = null;
  if (onProgress) {
    listener = await LibraryDownload.addListener('downloadProgress', (event) => {
      if (event?.bookId === book.id) onProgress(event.percent ?? 0);
    });
  }

  try {
    const saved = await LibraryDownload.download({
      url,
      bookId: book.id,
      // A standalone PDF is one file per volume, so it is named by volume: the
      // eleven volumes of Mawsuat al-Qabail share a book id and would otherwise
      // overwrite each other. An archive is shared by the whole book, so it is
      // stored under the book id and `volumeKey` stays absent.
      ...(archive ? {} : { volumeKey: volumeKey(book.id, volume.id) }),
      extension: archive ? 'zip' : 'pdf'
    });

    if (!archive) {
      onProgress?.(100);
      return { path: saved.path };
    }

    const extracted = await LibraryDownload.extractVolume({
      bookId: book.id,
      member: volume.path,
      volumeId,
      extension: 'zip'
    });
    onProgress?.(100);
    return { path: extracted.path };
  } finally {
    // Tearing the listener down must never mask the download's own outcome.
    if (listener) await listener.remove().catch(() => undefined);
  }
};

/**
 * A URL the in-app (pdfjs) reader can load a downloaded volume from, or null
 * when the volume is not on the device.
 *
 * A `file://` URL is not something the WebView is allowed to fetch.
 * `Capacitor.convertFileSrc` rewrites the path to the scheme the Capacitor
 * WebView serves app-local files from, so pdfjs can stream it like any other
 * document and the volume stays readable inside the app.
 */
export const nativeVolumeUrl = async (bookId, volumeId) => {
  if (!isNativeDownloadAvailable()) return null;
  try {
    const result = await LibraryDownload.volumePath({ volumeId: volumeKey(bookId, volumeId) });
    if (!result?.present || !result.uri) return null;
    // `result.uri` is file:///...; convertFileSrc wants the bare path.
    return Capacitor.convertFileSrc(result.uri.replace(/^file:\/\//, ''));
  } catch {
    return null;
  }
};

/** Delete a downloaded volume from the device. */
export const removeNativeVolume = async (bookId, volumeId) => {
  if (!isNativeDownloadAvailable()) return false;
  try {
    await LibraryDownload.remove({ volumeId: volumeKey(bookId, volumeId) });
    return true;
  } catch {
    return false;
  }
};

/** Delete a whole downloaded book, including every volume taken from it. */
export const removeNativeBook = async (bookId) => {
  if (!isNativeDownloadAvailable()) return false;
  try {
    // The native side sweeps the book's archive and every volume stored under
    // its composite key, so one call covers both archive and standalone files.
    await LibraryDownload.remove({ bookId });
    return true;
  } catch {
    return false;
  }
};

/** Bytes used by downloaded books, or null when unavailable. */
export const nativeUsage = async () => {
  if (!isNativeDownloadAvailable()) return null;
  try {
    const result = await LibraryDownload.usage();
    return typeof result?.bytes === 'number' ? result.bytes : null;
  } catch {
    return null;
  }
};