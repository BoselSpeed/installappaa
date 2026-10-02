package com.fiqh.app.pdf

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * Contract between the Capacitor plugin and the reader activity.
 *
 * The two are deliberately decoupled: [PdfReaderPlugin] builds the intent, and
 * [PdfReaderActivity] only reads these keys. That keeps the web layer from ever
 * touching Activity internals and makes the reader launchable from anywhere.
 */
object PdfReaderContract {

    /**
     * Stable book id used as the key for progress, bookmarks, notes and
     * highlights. Should be a slug (e.g. "diwan-al-hamasa"), not a file name, so
     * it survives the file being moved or re-downloaded.
     */
    const val EXTRA_BOOK_KEY = "book_key"

    /** Human-readable title shown in the toolbar. */
    const val EXTRA_TITLE = "title"

    /**
     * The document to open, as a URI string.
     *
     * Accepts three shapes, checked in order by the activity:
     *  - a file:// or content:// URI, passed straight to PdfView
     *  - an https:// URL, streamed over the network
     *  - anything else, treated as a path inside the app's assets
     *
     * The web layer sends the same value the web reader would have fetched, so
     * the two readers cannot drift onto different files.
     */
    const val EXTRA_URI = "uri"

    /** Optional page to open at; defaults to the saved position, else page 1. */
    const val EXTRA_PAGE = "page"

    /**
     * Build the intent that opens [PdfReaderActivity].
     *
     * @param page zero-based; omit or pass null to resume from saved progress.
     */
    fun intent(
        context: Context,
        bookKey: String,
        title: String,
        uri: String,
        page: Int? = null
    ): Intent = Intent(context, PdfReaderActivity::class.java).apply {
        putExtra(EXTRA_BOOK_KEY, bookKey)
        putExtra(EXTRA_TITLE, title)
        putExtra(EXTRA_URI, uri)
        page?.let { putExtra(EXTRA_PAGE, it) }
    }
}