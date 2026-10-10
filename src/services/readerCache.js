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
//   - bookmarks — pages the reader has marked, keyed by book;
//   - notes — text notes attached to pages, keyed by book;
//   - highlights — text snippets with colors on pages, keyed by book;
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

const writeJson = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
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

// ---- Bookmarks --------------------------------------------------------------

/** @returns {Array<{page:number, createdAt:number}>} */
export const getBookmarks = (storageKey) => {
  if (!storageKey) return [];
  const value = readJson(`bookmarks:${storageKey}`);
  return Array.isArray(value) ? value : [];
};

/** @param {Array<{page:number, createdAt:number}>} bookmarks */
export const saveBookmarks = (storageKey, bookmarks) => {
  if (!storageKey || !Array.isArray(bookmarks)) return;
  writeJson(`bookmarks:${storageKey}`, bookmarks.slice(0, 500));
};

/** Toggle a bookmark on a page. Returns true if bookmarked after the call. */
export const toggleBookmark = (storageKey, page) => {
  if (!storageKey) return false;
  const bookmarks = getBookmarks(storageKey);
  const idx = bookmarks.findIndex((b) => b.page === page);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    saveBookmarks(storageKey, bookmarks);
    return false;
  }
  bookmarks.push({ page, createdAt: Date.now() });
  saveBookmarks(storageKey, bookmarks);
  return true;
};

/** Check if a page is bookmarked. */
export const isBookmarked = (storageKey, page) => {
  if (!storageKey) return false;
  const bookmarks = getBookmarks(storageKey);
  return bookmarks.some((b) => b.page === page);
};

// ---- Notes ------------------------------------------------------------------

/** @returns {Array<{id:number, page:number, body:string, createdAt:number, updatedAt:number}>} */
export const getNotes = (storageKey) => {
  if (!storageKey) return [];
  const value = readJson(`notes:${storageKey}`);
  return Array.isArray(value) ? value : [];
};

/** @param {Array<{id:number, page:number, body:string, createdAt:number, updatedAt:number}>} notes */
export const saveNotes = (storageKey, notes) => {
  if (!storageKey || !Array.isArray(notes)) return;
  writeJson(`notes:${storageKey}`, notes.slice(0, 500));
};

/** Add or update a note. Returns the note id. */
export const saveNote = (storageKey, page, body, noteId = null) => {
  if (!storageKey) return null;
  const trimmed = body?.trim();
  if (!trimmed) return null;
  const notes = getNotes(storageKey);
  const now = Date.now();
  if (noteId) {
    const idx = notes.findIndex((n) => n.id === noteId);
    if (idx >= 0) {
      notes[idx] = { ...notes[idx], body: trimmed, updatedAt: now };
      saveNotes(storageKey, notes);
      return noteId;
    }
  }
  const id = Date.now();
  notes.push({ id, page, body: trimmed, createdAt: now, updatedAt: now });
  saveNotes(storageKey, notes);
  return id;
};

/** Delete a note by id. */
export const deleteNote = (storageKey, noteId) => {
  if (!storageKey) return;
  const notes = getNotes(storageKey).filter((n) => n.id !== noteId);
  saveNotes(storageKey, notes);
};

// ---- Highlights -------------------------------------------------------------

/** @returns {Array<{id:number, page:number, snippet:string, color:number, createdAt:number}>} */
export const getHighlights = (storageKey) => {
  if (!storageKey) return [];
  const value = readJson(`highlights:${storageKey}`);
  return Array.isArray(value) ? value : [];
};

/** @param {Array<{id:number, page:number, snippet:string, color:number, createdAt:number}>} highlights */
export const saveHighlights = (storageKey, highlights) => {
  if (!storageKey || !Array.isArray(highlights)) return;
  writeJson(`highlights:${storageKey}`, highlights.slice(0, 1000));
};

/** Add a highlight. Returns the highlight id. */
export const addHighlight = (storageKey, page, snippet, color = 0xFFFFFF00) => {
  if (!storageKey) return null;
  const normalised = normaliseSnippet(snippet);
  if (!normalised) return null;
  const highlights = getHighlights(storageKey);
  const id = Date.now();
  highlights.push({ id, page, snippet: normalised, color, createdAt: Date.now() });
  saveHighlights(storageKey, highlights);
  return id;
};

/** Delete a highlight by id. */
export const deleteHighlight = (storageKey, highlightId) => {
  if (!storageKey) return;
  const highlights = getHighlights(storageKey).filter((h) => h.id !== highlightId);
  saveHighlights(storageKey, highlights);
};

/** Get highlights for a specific page. */
export const getHighlightsOnPage = (storageKey, page) => {
  if (!storageKey) return [];
  return getHighlights(storageKey).filter((h) => h.page === page);
};

/** Collapse whitespace so a highlight survives reload. */
function normaliseSnippet(snippet) {
  return String(snippet || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default {
  getReadingPosition,
  saveReadingPosition,
  getTocCache,
  saveTocCache,
  getControlsHintSeen,
  markControlsHintSeen,
  getBookmarks,
  saveBookmarks,
  toggleBookmark,
  isBookmarked,
  getNotes,
  saveNotes,
  saveNote,
  deleteNote,
  getHighlights,
  saveHighlights,
  addHighlight,
  deleteHighlight,
  getHighlightsOnPage
};
