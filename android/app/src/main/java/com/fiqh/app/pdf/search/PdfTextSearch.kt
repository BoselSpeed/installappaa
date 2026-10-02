package com.fiqh.app.pdf.search

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.io.File
import java.io.IOException
import java.io.InputStream

/**
 * Page-level text search over the open book.
 *
 * AndroidPdfViewer draws pages through pdfium, which exposes no text API, so
 * searching means reading the document a second time through PDFBox and keeping
 * only the pages that contain the query. Rendering stays with pdfium; PDFBox is
 * used purely as a text source and is closed as soon as the index is built.
 *
 * ## Why results are page numbers rather than rectangles
 *
 * A PDF text layer has no screen coordinates until it is mapped through the
 * renderer's transform, and that transform depends on zoom, rotation and page
 * size at the moment of drawing. The page number is the one coordinate-free
 * result that is always correct, so a hit navigates to its page instead of
 * painting a box that would drift out of place as soon as the reader zooms.
 *
 * ## Cost
 *
 * Building the index walks every page once, which for a several-hundred-page
 * book is a noticeable pause. It therefore runs off the main thread, only when
 * the reader first opens the search dialog, and is kept for the life of the
 * activity so repeat searches are a plain string scan.
 */
class PdfTextSearch private constructor(
    private val pageTexts: List<String>
) {

    /** Page count the index was built from; may differ from the renderer's. */
    val pageCount: Int get() = pageTexts.size

    /**
     * Pages containing [query], in reading order.
     *
     * [wholeWords] requires word boundaries around the match, which is the
     * difference between searching for "صلاة" and for the letters that happen
     * to sit inside another word.
     *
     * Each page appears at most once: a hit navigates to a page, so listing the
     * same page once per occurrence would be noise.
     */
    fun findPages(query: String, wholeWords: Boolean = false): List<Int> {
        val needle = normalise(query)
        if (needle.isEmpty()) return emptyList()

        val matches = mutableListOf<Int>()
        pageTexts.forEachIndexed { index, pageText ->
            if (pageText.isEmpty()) return@forEachIndexed
            var from = pageText.indexOf(needle)
            while (from >= 0) {
                if (!wholeWords || isWholeWord(pageText, from, needle.length)) {
                    matches += index
                    break
                }
                from = pageText.indexOf(needle, from + 1)
            }
        }
        return matches
    }

    /** Occurrences of [query] on [pageIndex], for the per-result label. */
    fun countOn(pageIndex: Int, query: String): Int {
        val needle = normalise(query)
        val text = pageTexts.getOrNull(pageIndex) ?: return 0
        if (needle.isEmpty()) return 0
        var count = 0
        var from = text.indexOf(needle)
        while (from >= 0) {
            count++
            from = text.indexOf(needle, from + 1)
        }
        return count
    }

    /**
     * The first hit on [pageIndex] with surrounding context.
     *
     * Truncating on word boundaries keeps the snippet readable; a partial word
     * in Arabic carries no meaning on its own.
     */
    fun snippet(pageIndex: Int, query: String, radius: Int = 70): String {
        val needle = normalise(query)
        val text = pageTexts.getOrNull(pageIndex) ?: return ""
        if (needle.isEmpty()) return text.take(radius).trim()

        val at = text.indexOf(needle)
        if (at < 0) return text.take(radius).trim()

        var start = (at - radius).coerceAtLeast(0)
        if (start > 0) {
            // Move forward to the next space so the snippet does not begin
            // mid-word.
            val space = text.indexOf(' ', start)
            if (space in 1..at) start = space + 1
        }

        var end = (at + needle.length + radius).coerceAtMost(text.length)
        if (end < text.length) {
            val space = text.lastIndexOf(' ', end)
            if (space > at) end = space
        }

        val prefix = if (start > 0) "…" else ""
        val suffix = if (end < text.length) "…" else ""
        return prefix + text.substring(start, end).trim() + suffix
    }

    private fun isWholeWord(text: String, from: Int, length: Int): Boolean {
        val before = text.getOrNull(from - 1)
        val after = text.getOrNull(from + length)
        val boundaryBefore = before == null || !before.isLetterOrDigit()
        val boundaryAfter = after == null || !after.isLetterOrDigit()
        return boundaryBefore && boundaryAfter
    }

    companion object {
        /**
         * Fold away the differences a reader's keyboard introduces.
         *
         * Arabic orthography varies between how a word is written in a book and
         * how it is typed: diacritics, tatweel, and the several forms of alef.
         * A search that demanded an exact match would report nothing for a word
         * that is plainly on the page.
         */
        fun normalise(text: String): String =
            text.lowercase()
                .replace(Regex("[\\u064B-\\u0652\\u0640]"), "") // harakat + tatweel
                .replace("\u0622", "\u0627")                    // alef madda
                .replace("\u0623", "\u0627")                    // alef hamza above
                .replace("\u0625", "\u0627")                    // alef hamza below
                .replace("\u0649", "\u064A")                    // alef maqsura
                .replace(Regex("\\s+"), " ")
                .trim()

        /**
         * Build the index by reading [open]'s stream.
         *
         * @param open produces a fresh readable stream; PDFBox consumes it, and
         *   a single-use stream cannot be reused across retries.
         */
        fun build(context: Context, open: () -> InputStream): PdfTextSearch {
            // PDFBox resolves font substitutes from assets, which needs the app
            // context and must happen once per process before any parse.
            PDFBoxResourceLoader.init(context.applicationContext)

            var document: PDDocument? = null
            try {
                document = open().use { PDDocument.load(it) }
                val pages = document.numberOfPages
                // One stripper across all pages: building it per page re-reads
                // the font cache and dominates the runtime.
                val stripper = PDFTextStripper().apply { sortByPosition = true }
                val texts = ArrayList<String>(pages)
                for (page in 1..pages) {
                    stripper.startPage = page
                    stripper.endPage = page
                    texts += stripper.getText(document)
                }
                return PdfTextSearch(texts)
            } finally {
                // PDFBox holds native buffers; a document left open leaks file
                // handles across repeated searches.
                runCatching { document?.close() }
            }
        }

        /**
         * Open the URI the plugin was given for reading.
         *
         * `file:///android_asset/...` is not a filesystem path, so bundled books
         * go through the AssetManager; every other scheme goes to the
         * ContentResolver, which covers content URIs and cached downloads
         * alike. A bare path is read directly, which is what a file:// URL
         * without an authority reduces to.
         */
        fun streamFor(context: Context, uri: String): () -> InputStream = {
            when {
                uri.startsWith(ASSET_PREFIX) ->
                    context.assets.open(uri.removePrefix(ASSET_PREFIX))

                uri.startsWith("file://") ->
                    File(Uri.parse(uri).path.orEmpty()).inputStream()

                uri.contains("://") ->
                    context.contentResolver.openInputStream(Uri.parse(uri))
                        ?: throw IOException("Cannot open $uri")

                // A bare path is treated as an asset inside the APK.
                else -> context.assets.open(uri)
            }
        }

        private const val ASSET_PREFIX = "file:///android_asset/"
    }
}