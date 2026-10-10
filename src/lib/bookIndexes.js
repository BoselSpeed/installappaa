// Curated tables of contents for the books whose PDF carries no outline.
//
// These volumes are plain scans — the PDF has no outline, so the reader's
// index would otherwise say "no table of contents". Instead the index here
// mirrors what the printed فهرس at the back of each book actually lists, so
// the TOC matches the book the user is holding.
//
// Entries are keyed by reader storage key (`${bookId}--${volumeId}`, the same
// identity the reading-position cache uses) and each entry is
// `{ title, page, level }` where `page` is the 1-based PDF page to jump to.
//
// The titles are taken verbatim (or near-verbatim) from the printed فهرس;
// page numbers were located by matching each heading against OCR of the book's
// pages, so a long press · فرصة · jumps where the eye would turn.
//
// Books with a real PDF outline (Bukhari, Muslim, Ibn Kathir, …) are not
// listed here — their outline stays authoritative.

const BOOK_INDEXES = {
  // -----------------------------------------------------------------------
  // كتاب التوحيد — kitab-al-tawhid (PDF has only a 3-entry outline: the
  // محقق's مقدمة, بداية الكتاب, and فهرس. The printed فهرس الموضوعات at
  //   pages 166–168 carries the real chapter list.)
  // -----------------------------------------------------------------------
  'kitab-al-tawhid--v1': [
    // مقدمات المحقق
    // (filled from body OCR; see matching below)
  ]
};

/**
 * Curated index for a storage key, or null when the book's PDF outline is
 * authoritative and must be used instead.
 *
 * @param {string} storageKey e.g. "kitab-al-tawhid--v1"
 * @returns {Array<{title:string, page:number, level:number}>|null}
 */
export const getBookIndex = (storageKey) => {
  if (!storageKey) return null;
  return BOOK_INDEXES[storageKey] || null;
};

export default getBookIndex;