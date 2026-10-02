package com.fiqh.app.pdf.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * A user-placed marker on a single page of a book.
 *
 * Distinct from [ReadingProgress] (an automatic "where I stopped") and from
 * [Note] (which carries text): a bookmark is a bare page reference.
 */
@Entity(
    tableName = "bookmarks",
    // Bookmarks are always listed per book in page order, so the composite index
    // lets SQLite satisfy that query without sorting.
    indices = [Index(value = ["book_key", "page_index"])]
)
data class Bookmark(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /** Book this bookmark belongs to; matches [ReadingProgress.bookKey]. */
    @ColumnInfo(name = "book_key")
    val bookKey: String,

    /** Zero-based page index the bookmark points at. */
    @ColumnInfo(name = "page_index")
    val pageIndex: Int = 0,

    /** Optional user label. */
    @ColumnInfo(name = "label")
    val label: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)