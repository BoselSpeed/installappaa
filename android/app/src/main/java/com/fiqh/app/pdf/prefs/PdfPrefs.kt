package com.fiqh.app.pdf.prefs

import android.content.Context
import android.content.SharedPreferences

/**
 * Reader preferences that are per-device rather than per-book: zoom level, night
 * mode, and which paging mode is active.
 *
 * These live in [SharedPreferences] rather than Room because they are small,
 * read synchronously on every page render, and never queried. Room is for the
 * durable per-book data (position, bookmarks, notes, highlights).
 *
 * Every accessor returns a default when unset, so a first launch works without
 * any migration or seeding.
 */
class PdfPrefs private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE)

    /** Last zoom the reader used, as a PdfViewer zoom level (0..3). */
    var zoomLevel: Int
        get() = prefs.getInt(KEY_ZOOM, DEFAULT_ZOOM)
        set(value) = prefs.edit().putInt(KEY_ZOOM, value).apply()

    /** True when the dark reading surface is on. */
    var nightMode: Boolean
        get() = prefs.getBoolean(KEY_NIGHT_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_NIGHT_MODE, value).apply()

    /** True to scroll continuously instead of flipping page by page. */
    var continuousScroll: Boolean
        get() = prefs.getBoolean(KEY_CONTINUOUS, false)
        set(value) = prefs.edit().putBoolean(KEY_CONTINUOUS, value).apply()

    /** Reader orientation lock; [ORIENTATION_UNSET] leaves it to the system. */
    var orientationLock: Int
        get() = prefs.getInt(KEY_ORIENTATION, ORIENTATION_UNSET)
        set(value) = prefs.edit().putInt(KEY_ORIENTATION, value).apply()

    companion object {
        private const val FILE_NAME = "pdf_reader_prefs"
        private const val KEY_ZOOM = "zoom_level"
        private const val KEY_NIGHT_MODE = "night_mode"
        private const val KEY_CONTINUOUS = "continuous_scroll"
        private const val KEY_ORIENTATION = "orientation_lock"

        /** PdfViewer's own default zoom step. */
        const val DEFAULT_ZOOM = 1
        const val ORIENTATION_UNSET = -1

        @Volatile
        private var instance: PdfPrefs? = null

        fun get(context: Context): PdfPrefs =
            instance ?: synchronized(this) {
                instance ?: PdfPrefs(context).also { instance = it }
            }
    }
}