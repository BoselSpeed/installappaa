// PDF document loading and outline (table of contents) extraction.
//
// Two jobs live here so every consumer — the reader, the book page's index
// modal, both of which may touch the same book in one session — shares them:
//
//   1. `loadPdfDocument` opens a PDF through pdf.js with a small LRU of live
//      documents. Opening the same book twice (index preview, then reading)
//      reuses the parsed document instead of paying for it again, and the cap
//      keeps a long browsing session from holding every opened book in memory.
//   2. `extractOutline` walks the PDF's own outline tree and resolves each
//      heading to a page number, which is what fills the reader's table of
//      contents and the book page's index.
//
// Blob URLs (volumes stored in IndexedDB) are read into memory before pdf.js
// sees them, so the document never depends on a URL that the caller is free
// to revoke the moment loading finishes.

import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/** Live documents kept open, keyed by storage key (or URL as a fallback). */
const documents = new Map();

/** Upper bound on simultaneously open documents; the least recent is evicted. */
const MAX_OPEN_DOCUMENTS = 4;

const evictOldDocuments = () => {
  while (documents.size > MAX_OPEN_DOCUMENTS) {
    let oldestKey = null;
    let oldest = null;
    for (const [key, entry] of documents) {
      if (entry.doc && (!oldest || entry.lastUsed < oldest.lastUsed)) {
        oldest = entry;
        oldestKey = key;
      }
    }
    if (!oldestKey) break;
    documents.delete(oldestKey);
    try {
      oldest.doc.destroy();
    } catch {
      /* already gone */
    }
  }
};

const openDocument = async (url) => {
  if (/^blob:/i.test(url)) {
    // A blob: URL is scoped to this session and may be revoked as soon as the
    // caller is done with it, so the bytes are pulled into memory first and
    // pdf.js is handed a buffer rather than a resource it might stream from.
    const response = await fetch(url);
    const data = await response.arrayBuffer();
    return pdfjsLib.getDocument({ data }).promise;
  }
  return pdfjsLib.getDocument(url).promise;
};

/**
 * Open (or reuse) a PDF document.
 *
 * @param {string} url      Where the PDF comes from.
 * @param {string} [cacheKey] Identity to cache under — pass the book's
 *   storage key so the index preview and the reader share one document.
 * @returns {Promise<import('pdfjs-dist').PDFDocumentProxy>}
 */
export const loadPdfDocument = async (url, cacheKey = url) => {
  const hit = documents.get(cacheKey);
  if (hit) {
    hit.lastUsed = Date.now();
    return hit.promise;
  }

  const entry = { lastUsed: Date.now(), doc: null, promise: null };
  entry.promise = openDocument(url).then(
    (doc) => {
      entry.doc = doc;
      evictOldDocuments();
      return doc;
    },
    (error) => {
      documents.delete(cacheKey);
      throw error;
    }
  );
  documents.set(cacheKey, entry);
  return entry.promise;
};

/**
 * Flatten a PDF's outline into index entries.
 *
 * Each entry keeps its nesting level so the UI can indent it, and its resolved
 * 1-based page so it can be jumped to. Headings whose destination cannot be
 * resolved (broken outlines do exist) are dropped rather than listed as
 * dead links.
 *
 * @param {import('pdfjs-dist').PDFDocumentProxy|null|undefined} doc
 * @returns {Promise<Array<{title:string, page:number, level:number}>>}
 */
export const extractOutline = async (doc) => {
  if (!doc) return [];

  let outline;
  try {
    outline = await doc.getOutline();
  } catch {
    return [];
  }
  if (!outline || !outline.length) return [];

  const entries = [];

  const walk = async (items, level) => {
    for (const item of items) {
      let page = null;
      try {
        let dest = item.dest;
        if (typeof dest === 'string') dest = await doc.getDestination(dest);
        if (Array.isArray(dest) && dest[0]) {
          page = (await doc.getPageIndex(dest[0])) + 1;
        }
      } catch {
        // Unresolvable destination — see above.
      }

      const title = String(item.title || '').trim();
      if (title && page !== null) {
        entries.push({ title, page, level });
      }

      if (item.items && item.items.length) {
        await walk(item.items, level + 1);
      }
    }
  };

  await walk(outline, 1);
  return entries;
};

export default { loadPdfDocument, extractOutline };
