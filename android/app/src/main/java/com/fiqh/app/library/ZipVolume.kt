package com.fiqh.app.library

import java.io.File
import java.util.zip.ZipFile

/**
 * Extraction of a single volume out of a downloaded ZIP archive.
 *
 * Ten of the books in the library are published as a single archive on Google
 * Drive, with one PDF per volume inside it. The archive runs to tens of
 * megabytes, so downloading it once and extracting single volumes on demand
 * beats either re-downloading a whole book per volume or shipping every volume
 * inside the APK.
 */
object ZipVolume {

    /** One entry of the archive, as listed to the web layer. */
    data class Entry(val name: String, val sizeBytes: Long)

    /**
     * Every PDF in the archive, sorted by name so the list is stable.
     *
     * The archive is re-read on every call: it is only consulted when a book
     * detail screen mounts, so caching the listing would buy little for the
     * risk of showing stale entries after a re-download.
     */
    fun listPdfs(archive: File): List<Entry> {
        if (!archive.isFile) return emptyList()
        return runCatching {
            ZipFile(archive).use { zip ->
                zip.entries().asSequence()
                    .filter { !it.isDirectory && it.name.endsWith(".pdf", ignoreCase = true) }
                    .map { Entry(it.name.substringAfterLast('/'), it.size) }
                    .sortedBy { it.name }
                    .toList()
            }
        }.getOrDefault(emptyList())
    }

    /**
     * The archive entry matching [volumePath].
     *
     * `books.js` stores volumes as e.g. `0001-0343.pdf`, while the archive may
     * nest it under a folder or prefix, so the bare file name is matched first
     * and the exact path second. Matching on the name alone keeps a wrong path
     * in the data file from silently picking the wrong volume.
     */
    private fun resolve(zip: ZipFile, volumePath: String): java.util.zip.ZipEntry? {
        val wanted = volumePath.substringAfterLast('/')
        val entries = zip.entries().asSequence().filter { !it.isDirectory }.toList()
        return entries.firstOrNull { it.name == volumePath }
            ?: entries.firstOrNull { it.name.substringAfterLast('/') == wanted }
    }

    /**
     * Extract [volumePath] from [archive] into [target].
     *
     * [target] is written to a temporary file and moved into place only once the
     * copy succeeded, so an interrupted download can never leave a truncated
     * PDF that later fails to open with no way for the user to tell why.
     *
     * @return the number of bytes written, or throws if the entry is missing.
     */
    fun extract(archive: File, volumePath: String, target: File): Long {
        require(archive.isFile) { "archive has not been downloaded" }
        target.parentFile?.mkdirs()

        val partial = File(target.parentFile, "${target.name}.part")
        partial.delete()

        val written = runCatching {
            ZipFile(archive).use { zip ->
                val entry = resolve(zip, volumePath)
                    ?: error("volume \"$volumePath\" is not in the archive")

                val name = entry.name.substringAfterLast('/')
                // Guard against an archive entry that tries to write outside
                // the volumes directory via a crafted name.
                if (name.contains('/') || name.contains('\\') || name == "..") {
                    error("archive entry has an unusable name")
                }

                zip.getInputStream(entry).use { input ->
                    partial.outputStream().use { output ->
                        val buffer = ByteArray(64 * 1024)
                        var total = 0L
                        while (true) {
                            val read = input.read(buffer)
                            if (read <= 0) break
                            output.write(buffer, 0, read)
                            total += read
                        }
                        output.flush()
                        total
                    }
                }
            }
        }.getOrElse { error ->
            partial.delete()
            throw error
        }

        if (written <= 0L) {
            partial.delete()
            error("extracted volume is empty")
        }

        if (target.exists()) target.delete()
        if (!partial.renameTo(target)) {
            partial.delete()
            error("could not store the extracted volume")
        }
        return target.length()
    }
}