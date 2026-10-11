package com.fiqh.app.library

import android.content.Context
import java.io.File

/**
 * Where downloaded books live on the device.
 *
 * Three kinds of file matter, and they are kept apart on purpose:
 *  - the *source archive* (a ZIP holding every volume of a book), keyed by book
 *    id, because there is exactly one per book;
 *  - the *volume* files, which is what the reader actually opens. A volume is
 *    either downloaded on its own (a plain Drive PDF) or extracted out of an
 *    archive, and to the reader the two are indistinguishable, so they share
 *    one directory;
 *  - nothing else.
 *
 * Volume files are keyed by a composite id supplied by the web layer
 * (`bookId__volumeId`) rather than by `volume.id` alone. Volume ids repeat
 * across books -- `v1` alone appears eighteen times in the library -- so keying
 * on them would make different books overwrite each other.
 *
 * Everything lives under `filesDir`, not external storage: the app needs no
 * storage permission, and Android clears the directory on uninstall.
 */
object LibraryStore {

    private const val ROOT = "library"
    private const val VOLUMES = "volumes"

    /** Directory holding downloaded source archives (ZIP). */
    fun sourceDir(context: Context): File =
        File(context.filesDir, ROOT).apply { mkdirs() }

    /** Directory holding volume files, downloaded directly or extracted. */
    fun volumesDir(context: Context): File =
        File(sourceDir(context), VOLUMES).apply { mkdirs() }

    /**
     * Sanitise a book or volume id so it can never escape [sourceDir].
     *
     * Ids come from `books.js`, but they are still used to build a file path,
     * so anything that is not a plain identifier is folded to `_`.
     */
    fun safeId(id: String): String =
        id.map { if (it.isLetterOrDigit() || it == '-' || it == '_') it else '_' }
            .joinToString("")
            .ifEmpty { "unnamed" }

    /** The separator the web layer joins book and volume ids with. */
    private const val KEY_SEPARATOR = "__"

    /**
     * Build the composite key for a volume.
     *
     * Mirrors `volumeKey()` in `src/lib/nativeLibraryDownload.js`; the two must
     * stay in step or the reader would look for a file that was never written.
     */
    fun volumeKey(bookId: String, volumeId: String): String =
        "${safeId(bookId)}$KEY_SEPARATOR${safeId(volumeId)}"

    /** Path of a downloaded source archive for a book. */
    fun sourceFile(context: Context, bookId: String, extension: String): File =
        File(sourceDir(context), "${safeId(bookId)}.${extension.lowercase()}")

    /**
     * Path a volume is stored at, whether it was downloaded directly or pulled
     * out of an archive.
     */
    fun volumeFile(context: Context, volumeId: String): File =
        File(volumesDir(context), "${safeId(volumeId)}.pdf")

    /** Whether a volume file exists and is worth opening. */
    fun hasVolume(context: Context, volumeId: String): Boolean {
        val file = volumeFile(context, volumeId)
        return file.isFile && file.length() > 0L
    }

    /**
     * Every volume file belonging to a book.
     *
     * Used when a book is deleted, so a book's volumes go with it even when the
     * caller only knows the book id.
     */
    fun volumesForBook(context: Context, bookId: String): List<File> {
        val prefix = "${safeId(bookId)}$KEY_SEPARATOR"
        return volumesDir(context).listFiles()
            ?.filter { it.isFile && it.name.startsWith(prefix) }
            ?: emptyList()
    }

    /** Total bytes used by downloaded books, for display in settings. */
    fun usedBytes(context: Context): Long =
        sourceDir(context).walkTopDown().filter { it.isFile }.sumOf { it.length() }
}