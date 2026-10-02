package com.fiqh.app.pdf.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * A text highlight the reader made inside a book.
 *
 * **How a highlight is stored — and why.**
 *
 * AndroidPdfViewer's selection produces screen-space rectangles that change with
 * zoom level, page rotation and window size, so persisting raw rectangles would
 * replay highlights in the wrong places. Instead a highlight is stored as the
 * *snippet of text* it covers plus the page it was found on. On load the reader
 * re-runs a search for that snippet and re-applies the colour to whatever rects
 * come back, which stays correct at any zoom.
 *
 * The trade-off is deliberate: a highlight cannot be restored if the underlying
 * text is no longer selectable in that PDF (e.g. a scanned page with no text
 * layer). Scans are image-only, so see [PdfReaderActivity] for how those are
 * handled.
 */
@Entity(
    tableName = "highlights",
    indices = [Index(value = ["book_key", "page_index"])]
)
data class Highlight(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /** Book this highlight belongs to; matches [ReadingProgress.bookKey]. */
    @ColumnInfo(name = "book_key")
    val bookKey: String,

    /** Zero-based page index the highlight sits on. */
    @ColumnInfo(name = "page_index")
    val pageIndex: Int = 0,

    /**
     * The selected text, used to find the highlight again on reload.
     *
     * Trimmed and whitespace-collapsed when written, because PDF text extraction
     * frequently inserts line breaks mid-sentence.
     */
    @ColumnInfo(name = "snippet")
    val snippet: String,

    /** ARGB colour chosen by the reader (see HighlightColors). */
    @ColumnInfo(name = "color")
    val color: Int,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)