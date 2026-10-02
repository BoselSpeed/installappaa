package com.fiqh.app.pdf.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * A free-text note the reader wrote about a specific page.
 *
 * Notes are always listed per book, newest first, so [bookKey] is indexed
 * alongside [createdAt].
 */
@Entity(
    tableName = "notes",
    indices = [Index(value = ["book_key", "created_at"])]
)
data class Note(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /** Book this note belongs to; matches [ReadingProgress.bookKey]. */
    @ColumnInfo(name = "book_key")
    val bookKey: String,

    /** Zero-based page index the note is anchored to. */
    @ColumnInfo(name = "page_index")
    val pageIndex: Int = 0,

    /**
     * The note body.
     *
     * Stored as TEXT, which is also what copy/paste from the selection
     * clipboard produces, so pasting a passage needs no conversion.
     */
    @ColumnInfo(name = "body")
    val body: String,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)