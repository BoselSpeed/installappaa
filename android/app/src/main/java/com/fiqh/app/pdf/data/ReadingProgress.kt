package com.fiqh.app.pdf.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Last reading position for one book.
 *
 * One row per book. [bookKey] is the stable identifier passed in from the web
 * layer (see PdfReaderPlugin); it is deliberately decoupled from the file name
 * so a book can move between bundled assets and downloaded files without losing
 * the reader's place.
 */
@Entity(
    tableName = "reading_progress",
    indices = [Index(value = ["book_key"], unique = true)]
)
data class ReadingProgress(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /** Stable book identifier, e.g. "diwan-al-hamasa". */
    @ColumnInfo(name = "book_key")
    val bookKey: String,

    /** Zero-based page index the reader stopped on. */
    @ColumnInfo(name = "page_index")
    val pageIndex: Int = 0,

    /**
     * Sub-page scroll offset within [pageIndex], 0f..1f.
     *
     * Kept because continuous scroll mode can stop part-way through a page, so
     * storing the page alone would not restore the exact position.
     */
    @ColumnInfo(name = "scroll_offset")
    val scrollOffset: Float = 0f,

    /** Epoch millis of the last time this book was open. */
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)