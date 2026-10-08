// On-device reader cache.
//
// Everything the reader remembers between sessions lives in localStorage under
// one namespace, so it survives reloads, works offline and needs no server:
//
//   - reading position — the page (plus zoom and fit mode) each book was left
//     on, keyed by the same composite slug the native reader uses, so a volume
//     keeps one identity across both readers;
//   - extracted table of contents — headings pulled out of a PDF's own
//     outline, cached so the index never has to be parsed twice;
//   - the one-time "tap to show the controls" hint flag.
//
// Every access is wrapped: a full disk, a private-mode profile or a corrupted
// value must never break reading — the reader simply starts from page 1 with
// no index instead.

const PREFIX = 'fiqh-reader:';

const readRaw = (key) => {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
};

const writeRaw = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, value);
    return true;
  } catch {
    // Quota exceeded or storage disabled — losing state is acceptable,
    // losing the reader is not.
    return false;
  }
};

const readJson = (key) => {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Last position a reader stopped at for a book, or null when never opened.
 *
 * @param {string} storageKey e.g. "kitab-al-tawhid--v1"
 * @returns {{page:number, numPages?:number, zoom?:number, fitMode?:string, updatedAt:number}|null}
 */
export const getReadingPosition = (storageKey) => {
  if (!storageKey) return null;
  const value = readJson(`pos:${storageKey}`);
  if (!value || !Number.isFinite(value.page) || value.page < 1) return null;
  return value;
};

/**
 * Persist where the reader is, so the next open resumes on the same page.
 *
 * @param {string} storageKey
 * @param {{page:number, numPages?:number, zoom?:number, fitMode?:string}} position
 */
export const saveReadingPosition = (storageKey, position) => {
  if (!storageKey || !position) return;
  writeRaw(
    `pos:${storageKey}`,
    JSON.stringify({
      page: Math.max(1, Math.round(position.page)),
      numPages: position.numPages,
      zoom: position.zoom,
      fitMode: position.fitMode,
      updatedAt: Date.now()
    })
  );
};

/**
 * Cached table of contents for a book, or null when it has not been
 * extracted yet. An empty array is a valid cached answer meaning "this PDF
 * carries no outline", which is different from "not parsed yet".
 *
 * @param {string} storageKey
 * @returns {Array<{title:string, page:number, level:number}>|null}
 */
export const getTocCache = (storageKey) => {
  if (!storageKey) return null;
  const value = readJson(`toc:${storageKey}`);
  return Array.isArray(value) ? value : null;
};

/**
 * Store an extracted outline. Capped so a pathological document cannot grow
 * the cache without bound.
 */
export const saveTocCache = (storageKey, entries) => {
  if (!storageKey || !Array.isArray(entries)) return;
  writeRaw(`toc:${storageKey}`, JSON.stringify(entries.slice(0, 2000)));
};

/** Whether the one-time control hint has already been shown. */
export const getControlsHintSeen = () => readRaw('controls-hint') === '1';

export const markControlsHintSeen = () => writeRaw('controls-hint', '1');

export default {
  getReadingPosition,
  saveReadingPosition,
  getTocCache,
  saveTocCache,
  getControlsHintSeen,
  markControlsHintSeen
};
