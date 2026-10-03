package com.fiqh.app.library

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
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

/**
 * Downloads books the browser is not allowed to fetch.
 *
 * Every remote PDF in the library is hosted on Google Drive, which sends no
 * `Access-Control-Allow-Origin` header. From the WebView a `fetch()` is
 * therefore rejected before a single byte arrives, which is why the download
 * button used to fail silently with no way for the user to tell why.
 *
 * Native code has no such restriction, so the transfer is done here instead:
 * an ordinary HTTP GET against the same URL, reporting progress back to the
 * web layer. Books published as a single ZIP are downloaded once and their
 * volumes extracted on demand (see [ZipVolume]).
 */
@CapacitorPlugin(name = "LibraryDownload")
class LibraryDownloadPlugin : Plugin() {

    /** Progress is emitted on this channel so one download can be watched. */
    private val progressChannel = "downloadProgress"

    private val ioScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Whether this device can fetch a book itself.
     *
     * Always true for this plugin: the web layer checks for the plugin's
     * existence instead, and falls back to opening a file at its source when
     * it is absent.
     */
    @PluginMethod
    fun probe(call: PluginCall) {
        call.resolve(JSObject().put("supported", true))
    }

    /**
     * Download a file into app storage, reporting progress.
     *
     * Expects `url` and `bookId`. Two shapes are supported:
     *
     *  - a single volume (`volumeKey` given): stored as a volume file, keyed by
     *    that composite id. This is what a plain Drive PDF is. The composite key
     *    is required because one book can have many such volumes, and because
     *    volume ids such as `v1` repeat across books.
     *  - a whole book (`volumeKey` absent): stored as a source archive keyed by
     *    `bookId`, to be split into volumes by [extractVolume].
     *
     * Resolves `{ path, bytes, reused }`, where `reused` is true when the file
     * was already on the device and nothing was transferred.
     */
    @PluginMethod
    fun download(call: PluginCall) {
        val url = call.getString("url")
        val bookId = call.getString("bookId")
        val volumeKey = call.getString("volumeKey")
        val extension = (call.getString("extension") ?: "pdf").lowercase(Locale.ROOT)

        if (url.isNullOrBlank() || bookId.isNullOrBlank()) {
            call.reject("url and bookId are required")
            return
        }

        val target = if (volumeKey.isNullOrBlank()) {
            LibraryStore.sourceFile(context, bookId, extension)
        } else {
            LibraryStore.volumeFile(context, volumeKey)
        }

        // A stored copy is reused as-is. Re-downloading tens of megabytes on
        // every tap is what made this unusable before.
        if (target.isFile && target.length() > 0L) {
            call.resolve(
                JSObject()
                    .put("path", target.absolutePath)
                    .put("bytes", target.length())
                    .put("reused", true)
            )
            return
        }

        ioScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    fetchToFile(url, target, bookId, extension)
                }
                withContext(Dispatchers.Main) { call.resolve(result) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject("download failed: ${e.message ?: e.javaClass.simpleName}", e)
                }
            }
        }
    }

    /**
     * Stream [url] into [target], reporting progress as it goes.
     *
     * Writes to a temporary file and moves it into place only after the whole
     * body arrived and proved to be the expected kind of file, so an
     * interrupted transfer can never be mistaken for a valid download later.
     */
    private fun fetchToFile(
        url: String,
        target: File,
        bookId: String,
        extension: String
    ): JSObject {
        target.parentFile?.mkdirs()
        val partial = File(target.parentFile, "${target.name}.part")
        partial.delete()

        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 30_000
            readTimeout = 60_000
            instanceFollowRedirects = true
            requestMethod = "GET"
            setRequestProperty("Accept", "*/*")
            setRequestProperty("User-Agent", "FiqhApp/2.0")
        }

        try {
            val code = connection.responseCode
            if (code !in 200..299) {
                error("the server refused the download (HTTP $code)")
            }

            val declared = connection.contentLengthLong.takeIf { it > 0L } ?: 0L

            connection.inputStream.use { input ->
                FileOutputStream(partial).use { output ->
                    val buffer = ByteArray(128 * 1024)
                    var received = 0L
                    var lastReported = -1

                    while (true) {
                        val read = input.read(buffer)
                        if (read <= 0) break
                        output.write(buffer, 0, read)
                        received += read

                        // Percentage where the server declared a length, and a
                        // coarse progress estimate otherwise, so the UI always
                        // has something to show.
                        val percent = if (declared > 0L) {
                            ((received * 100L) / declared).toInt().coerceIn(0, 99)
                        } else {
                            ((received / (256L * 1024L)) * 2L).toInt().coerceIn(0, 99)
                        }
                        if (percent != lastReported) {
                            lastReported = percent
                            notifyProgress(bookId, percent, received, declared)
                        }
                    }
                    output.flush()
                }
            }

            if (partial.length() <= 0L) {
                error("the host returned an empty file")
            }

            // Drive sometimes answers a large file with an HTML confirmation
            // page instead of the file. Storing that would produce a PDF that
            // cannot be opened, with no clue why, so it is caught here instead.
            val signature = readSignature(partial)
            val looksRight = when (extension) {
                "zip" -> signature.startsWith("PK")
                "pdf" -> signature.startsWith("%PDF")
                else -> true
            }
            if (!looksRight) {
                error("the host did not return a $extension file")
            }

            if (target.exists()) target.delete()
            if (!partial.renameTo(target)) {
                error("could not store the downloaded file")
            }

            notifyProgress(bookId, 100, target.length(), target.length())
            return JSObject()
                .put("path", target.absolutePath)
                .put("bytes", target.length())
                .put("reused", false)
        } catch (e: Exception) {
            // A half-written file would otherwise be picked up as a valid
            // download on the next tap.
            partial.delete()
            throw e
        } finally {
            connection.disconnect()
        }
    }

    /** First few bytes of a file, as text, for identifying its type. */
    private fun readSignature(file: File): String =
        file.inputStream().use { input ->
            val buffer = ByteArray(8)
            val read = input.read(buffer)
            if (read <= 0) "" else String(buffer, 0, read, Charsets.ISO_8859_1)
        }

    /** Emit a progress event for the given book, if anyone is listening. */
    private fun notifyProgress(bookId: String, percent: Int, received: Long, total: Long) {
        val payload = JSObject()
            .put("bookId", bookId)
            .put("percent", percent)
            .put("received", received)
            .put("total", total)
        // Listeners are dispatched by the bridge, so this has to happen on the
        // main thread even though the work happens on IO.
        activity?.runOnUiThread { notifyListeners(progressChannel, payload) }
    }

    /**
     * The volumes contained in a downloaded ZIP archive.
     *
     * Expects `bookId` (plus `extension` as a hint). Resolves
     * `{ members: [{ name, sizeBytes }] }`.
     */
    @PluginMethod
    fun listMembers(call: PluginCall) {
        val bookId = call.getString("bookId")
        val extension = (call.getString("extension") ?: "zip").lowercase(Locale.ROOT)
        if (bookId.isNullOrBlank()) {
            call.reject("bookId is required")
            return
        }

        ioScope.launch {
            try {
                val members = withContext(Dispatchers.IO) {
                    ZipVolume.listPdfs(LibraryStore.sourceFile(context, bookId, extension))
                }
                val array = JSArray()
                members.forEach { entry ->
                    array.put(JSObject().put("name", entry.name).put("sizeBytes", entry.sizeBytes))
                }
                withContext(Dispatchers.Main) { call.resolve(JSObject().put("members", array)) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject("could not read the archive: ${e.message}", e)
                }
            }
        }
    }

    /**
     * Pull one volume out of a downloaded archive.
     *
     * Expects `bookId`, `member` (the path recorded in books.js) and
     * `volumeId`. Resolves `{ path, bytes }` pointing at a real file the native
     * reader can open directly.
     */
    @PluginMethod
    fun extractVolume(call: PluginCall) {
        val bookId = call.getString("bookId")
        val member = call.getString("member")
        val volumeId = call.getString("volumeId")
        val extension = (call.getString("extension") ?: "zip").lowercase(Locale.ROOT)

        if (bookId.isNullOrBlank() || member.isNullOrBlank() || volumeId.isNullOrBlank()) {
            call.reject("bookId, member and volumeId are required")
            return
        }

        ioScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    val archive = LibraryStore.sourceFile(context, bookId, extension)
                    val target = LibraryStore.volumeFile(context, volumeId)
                    val bytes = ZipVolume.extract(archive, member, target)
                    JSObject().put("path", target.absolutePath).put("bytes", bytes)
                }
                withContext(Dispatchers.Main) { call.resolve(result) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject("extract failed: ${e.message ?: e.javaClass.simpleName}", e)
                }
            }
        }
    }

    /** Whether a volume has already been stored on the device. */
    @PluginMethod
    fun hasVolume(call: PluginCall) {
        val volumeId = call.getString("volumeId")
        if (volumeId.isNullOrBlank()) {
            call.reject("volumeId is required")
            return
        }
        val present = LibraryStore.hasVolume(context, volumeId)
        call.resolve(
            JSObject()
                .put("present", present)
                .put("path", if (present) LibraryStore.volumeFile(context, volumeId).absolutePath else "")
        )
    }

    /**
     * Delete a stored volume, or a whole downloaded book.
     *
     * Expects `volumeId` to remove one volume, or `bookId` to remove a book's
     * archive together with every volume taken out of or downloaded for it.
     */
    @PluginMethod
    fun remove(call: PluginCall) {
        val volumeId = call.getString("volumeId")
        val bookId = call.getString("bookId")
        if (volumeId.isNullOrBlank() && bookId.isNullOrBlank()) {
            call.reject("volumeId or bookId is required")
            return
        }

        ioScope.launch {
            var removed = 0
            withContext(Dispatchers.IO) {
                if (!volumeId.isNullOrBlank()) {
                    val file = LibraryStore.volumeFile(context, volumeId)
                    if (file.isFile && file.delete()) removed++
                }
                if (!bookId.isNullOrBlank()) {
                    // The archive, plus any volume downloaded or extracted for
                    // this book, all of which carry its composite key prefix.
                    LibraryStore.sourceDir(context).listFiles()
                        ?.filter { it.isFile && it.name.startsWith("${LibraryStore.safeId(bookId)}.") }
                        ?.forEach { if (it.delete()) removed++ }
                    LibraryStore.volumesForBook(context, bookId)
                        .forEach { if (it.delete()) removed++ }
                }
            }
            withContext(Dispatchers.Main) { call.resolve(JSObject().put("removed", removed)) }
        }
    }

    /** Bytes used by downloaded books, so settings can report them. */
    @PluginMethod
    fun usage(call: PluginCall) {
        ioScope.launch {
            val bytes = withContext(Dispatchers.IO) { LibraryStore.usedBytes(context) }
            withContext(Dispatchers.Main) { call.resolve(JSObject().put("bytes", bytes)) }
        }
    }

    /**
     * Absolute path a native reader should use for a volume.
     *
     * Kept here so the web layer never has to know the on-disk layout; it just
     * asks for the volume id and gets a `file://` URI back.
     */
    @PluginMethod
    fun volumePath(call: PluginCall) {
        val volumeId = call.getString("volumeId")
        if (volumeId.isNullOrBlank()) {
            call.reject("volumeId is required")
            return
        }
        val present = LibraryStore.hasVolume(context, volumeId)
        call.resolve(
            JSObject()
                .put("present", present)
                .put(
                    "uri",
                    if (present) "file://${LibraryStore.volumeFile(context, volumeId).absolutePath}"
                    else ""
                )
        )
    }
}