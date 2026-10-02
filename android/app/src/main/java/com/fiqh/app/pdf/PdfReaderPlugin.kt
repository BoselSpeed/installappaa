package com.fiqh.app.pdf

import android.content.ActivityNotFoundException
import com.fiqh.app.pdf.data.Bookmark
import com.fiqh.app.pdf.data.PdfDatabase
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Web-to-native bridge for the PDF reader.
 *
 * A Capacitor app is a WebView, so handing control to [PdfReaderActivity]
 * requires a registered plugin. The web layer calls
 * `PdfReader.open({ bookKey, title, uri })` and knows nothing about the reader's
 * internals.
 *
 * The plugin holds no reader state: the activity owns that, so rotating the
 * device, or leaving the reader for the WebView and coming back, behave the same.
 */
@CapacitorPlugin(name = "PdfReader")
class PdfReaderPlugin : Plugin() {

    /**
     * Scope for database reads.
     *
     * Tied to [Dispatchers.IO] because Room refuses main-thread queries. A
     * [SupervisorJob] is used so one failing read cannot cancel the others.
     */
    private val dbScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Open a book in the native reader.
     *
     * Expects:
     * - `bookKey` string  stable slug; keys progress, notes, bookmarks
     * - `title`   string  shown in the toolbar
     * - `uri`     string  asset path, file://, content:// or https:// URL
     * - `page`    number  optional zero-based page to open at
     *
     * Resolves `{ opened: true }`, or rejects with the reason it could not start.
     */
    @PluginMethod
    fun open(call: PluginCall) {
        val bookKey = call.getString("bookKey")
        val uri = call.getString("uri")

        if (bookKey.isNullOrBlank() || uri.isNullOrBlank()) {
            call.reject("bookKey and uri are required to open the reader")
            return
        }

        val activity = activity
        if (activity == null) {
            // Only reachable if the call races the activity being destroyed.
            call.reject("No foreground activity to start the reader from")
            return
        }

        val page = if (call.hasOption("page")) call.getInt("page") else null

        try {
            activity.startActivity(
                PdfReaderContract.intent(
                    context = activity,
                    bookKey = bookKey,
                    title = call.getString("title").orEmpty(),
                    uri = uri,
                    page = page
                )
            )
            call.resolve(JSObject().put("opened", true))
        } catch (e: ActivityNotFoundException) {
            // Only reachable if the activity were removed from the manifest.
            call.reject("PDF reader activity is not available: ${e.message}", e)
        }
    }

    /**
     * Whether the native reader can handle a given source.
     *
     * The web layer calls this before offering the "open in native reader"
     * action, so it does not have to re-implement the same rules in JavaScript.
     *
     * `blob:` URLs are reported unsupported: they exist only inside the WebView's
     * session and mean nothing to a native file reader, so locally downloaded
     * volumes have to stay with the web reader.
     *
     * Expects `uri`. Resolves `{ supported: boolean, reason?: string }`.
     */
    @PluginMethod
    fun canOpen(call: PluginCall) {
        val uri = call.getString("uri")
        val result = JSObject()

        when {
            uri.isNullOrBlank() -> {
                result.put("supported", false)
                result.put("reason", "missing uri")
            }
            uri.startsWith("blob:") -> {
                result.put("supported", false)
                result.put("reason", "blob urls are scoped to the webview session")
            }
            uri.startsWith("http://") || uri.startsWith("https://") -> result.put("supported", true)
            // file:// or content:// handed over by the web layer.
            uri.contains("://") -> result.put("supported", true)
            // A bare path: the reader resolves it against the APK assets.
            else -> result.put("supported", true)
        }

        call.resolve(result)
    }

    /**
     * Saved reading position for a book.
     *
     * Lets the library screens show "continue where you left off" without the
     * web layer duplicating the reader's storage.
     *
     * Expects `bookKey`. Resolves
     * `{ bookKey, pageIndex, scrollOffset, updatedAt }`, with `pageIndex: -1`
     * meaning the book has never been opened.
     */
    @PluginMethod
    fun getProgress(call: PluginCall) {
        val bookKey = call.getString("bookKey")
        if (bookKey.isNullOrBlank()) {
            call.reject("bookKey is required")
            return
        }

        dbScope.launch {
            val progress = PdfDatabase.get(context).readingProgressDao().get(bookKey)
            val result = JSObject().put("bookKey", bookKey)

            if (progress == null) {
                // -1 is the "never opened" sentinel the web layer maps to page 1.
                result.put("pageIndex", -1)
                result.put("scrollOffset", 0.0)
                result.put("updatedAt", 0)
            } else {
                result.put("pageIndex", progress.pageIndex)
                result.put("scrollOffset", progress.scrollOffset.toDouble())
                result.put("updatedAt", progress.updatedAt)
            }

            // Resolve back on the main thread, which is where the bridge
            // expects plugin calls to be answered.
            withContext(Dispatchers.Main) { call.resolve(result) }
        }
    }

    /**
     * Bookmarks saved for a book, for display on book cards.
     *
     * Expects `bookKey`. Resolves `{ bookmarks: [{ id, pageIndex, label }] }`.
     */
    @PluginMethod
    fun listBookmarks(call: PluginCall) {
        val bookKey = call.getString("bookKey")
        if (bookKey.isNullOrBlank()) {
            call.reject("bookKey is required")
            return
        }

        dbScope.launch {
            val rows: List<Bookmark> =
                PdfDatabase.get(context).bookmarkDao().observeForBookOnce(bookKey)

            val items = JSArray()
            rows.forEach { bookmark ->
                items.put(
                    JSObject()
                        .put("id", bookmark.id)
                        .put("pageIndex", bookmark.pageIndex)
                        .put("label", bookmark.label)
                )
            }

            withContext(Dispatchers.Main) {
                call.resolve(JSObject().put("bookmarks", items))
            }
        }
    }
}