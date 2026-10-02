// JavaScript side of the native PDF reader bridge.
//
// The Android app is a Capacitor WebView, so the native reader cannot be opened
// from a link. It is started through the `PdfReader` plugin registered in
// MainActivity, which launches PdfReaderActivity with the arguments below.
//
// Everything here degrades quietly: on web, and on any platform where the plugin
// is not registered, `isNativeReaderAvailable()` returns false and the web reader
// (src/components/Content/PDFReader.jsx) stays in charge. No caller needs to
// branch on platform itself.

import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Proxy for the Kotlin `PdfReaderPlugin`. Never throws on import: on web the
 * plugin simply does not exist, and calls made against it reject at runtime.
 */
const PdfReader = registerPlugin('PdfReader');

/** True when running inside the native Android shell with the plugin present. */
export const isNativeReaderAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/**
 * Translate a web URL into something the native reader can open.
 *
 * The reader cannot use the WebView's own origin or a `blob:` URL:
 *  - `blob:` URLs are scoped to the WebView session and mean nothing to a
 *    native file reader, so downloaded volumes must stay with the web reader.
 *  - Same-origin app paths (e.g. `/books/kitab-al-tawhid.pdf`) are really files
 *    inside the APK. Capacitor copies the built web assets to
 *    `assets/public`, so those map onto `file:///android_asset/public/...`,
 *    which the native PDF renderer can read directly and far faster than
 *    re-downloading them over the WebView.
 *
 * Anything already absolute (http/https/file/content) is returned untouched.
 */
export const toNativeReadableUri = (url) => {
  if (!url) return '';
  if (/^(blob:|data:|https?:|file:|content:)/i.test(url)) return url;

  const normalised = url.startsWith('/') ? url : `/${url}`;
  return `file:///android_asset/public${normalised}`;
};

/**
 * Whether the native reader can open a given source.
 *
 * Delegates the decision to the plugin so the rules live in one place. Returns
 * false on web, where there is no native reader at all.
 */
export const canOpenInNativeReader = async (url) => {
  if (!isNativeReaderAvailable()) return { supported: false, reason: 'not-native' };
  try {
    return await PdfReader.canOpen({ uri: toNativeReadableUri(url) });
  } catch {
    // Plugin missing (e.g. an APK built before this bridge existed).
    return { supported: false, reason: 'plugin-unavailable' };
  }
};

/**
 * Open a volume in the native reader.
 *
 * @param {object} options
 * @param {string} options.bookKey  Stable slug, e.g. "kitab-al-tawhid-v1".
 *   Must stay the same across app launches or saved progress will be orphaned.
 * @param {string} options.title    Toolbar title.
 * @param {string} options.url      Web URL of the PDF; converted automatically.
 * @param {number} [options.page]   Zero-based page to open at.
 * @returns {Promise<boolean>} true when the reader was launched.
 */
export const openInNativeReader = async ({ bookKey, title, url, page }) => {
  if (!isNativeReaderAvailable()) return false;
  const uri = toNativeReadableUri(url);
  if (!uri) return false;

  try {
    await PdfReader.open({ bookKey, title, uri, page });
    return true;
  } catch {
    return false;
  }
};

/**
 * Saved reading position for a book, or null when it has never been opened.
 *
 * @returns {Promise<{pageIndex: number, updatedAt: number}|null>}
 */
export const getNativeProgress = async (bookKey) => {
  if (!isNativeReaderAvailable()) return null;
  try {
    const result = await PdfReader.getProgress({ bookKey });
    // -1 is the native "never opened" sentinel.
    return result && result.pageIndex >= 0 ? result : null;
  } catch {
    return null;
  }
};

/**
 * Bookmarks saved for a book, for showing a marker on library cards.
 *
 * @returns {Promise<Array<{id: number, pageIndex: number, label: string|null}>>}
 */
export const getNativeBookmarks = async (bookKey) => {
  if (!isNativeReaderAvailable()) return [];
  try {
    const result = await PdfReader.listBookmarks({ bookKey });
    return result?.bookmarks || [];
  } catch {
    return [];
  }
};