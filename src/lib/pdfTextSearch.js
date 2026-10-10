// PDF text search for the in-app reader.
//
// Extracts the text layer from a PDF using pdf.js and builds an in-memory
// index for fast searching.

import { loadPdfDocument } from './pdfOutline';

const MAX_PAGES_TO_INDEX = 500; // Safety cap for very long books

/**
 * Build a search index for a PDF document.
 * Returns an object with a `findPages(query, wholeWords)` method.
 */
export async function buildSearchIndex(pdfUrl, storageKey, onProgress) {
  const pdf = await loadPdfDocument(pdfUrl, storageKey || pdfUrl);
  const numPages = pdf.numPages;
  const pagesToIndex = Math.min(numPages, MAX_PAGES_TO_INDEX);

  const pageTexts = new Array(pagesToIndex + 1); // 1-indexed

  for (let i = 1; i <= pagesToIndex; i++) {
    if (onProgress) onProgress(i, pagesToIndex);
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item) => item.str && item.str.trim())
        .map((item) => item.str)
        .join(' ');
      pageTexts[i] = normaliseText(text);
    } catch {
      pageTexts[i] = '';
    }
  }

  return {
    numPages,
    findPages(query, wholeWords = false) {
      const needle = normaliseText(query);
      if (!needle) return [];

      const regex = wholeWords
        ? new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i')
        : new RegExp(escapeRegExp(needle), 'i');

      const hits = [];
      for (let i = 1; i <= pagesToIndex; i++) {
        if (pageTexts[i] && regex.test(pageTexts[i])) {
          hits.push(i);
        }
      }
      return hits;
    },
    getSnippet(page, query, maxLength = 160) {
      const text = pageTexts[page] || '';
      const needle = normaliseText(query);
      if (!needle || !text) return '';

      const regex = new RegExp(`(.{0,${maxLength}}${escapeRegExp(needle)}.{0,${maxLength}})`, 'i');
      const match = text.match(regex);
      return match ? match[1] : text.slice(0, maxLength);
    }
  };
}

function normaliseText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}