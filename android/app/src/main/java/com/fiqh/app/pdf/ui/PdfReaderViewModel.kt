package com.fiqh.app.pdf.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.fiqh.app.pdf.data.Bookmark
import com.fiqh.app.pdf.data.BookmarkDao
import com.fiqh.app.pdf.data.Highlight
import com.fiqh.app.pdf.data.HighlightDao
import com.fiqh.app.pdf.data.Note
import com.fiqh.app.pdf.data.NoteDao
import com.fiqh.app.pdf.data.PdfDatabase
import com.fiqh.app.pdf.data.ReadingProgress
import com.fiqh.app.pdf.data.ReadingProgressDao
import com.fiqh.app.pdf.prefs.PdfPrefs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Holds the reader's state across configuration changes and rotation.
 *
 * The activity re-creates on rotation; without this, every rotation would drop
 * the open document and force a re-render. The ViewModel keeps the Room-backed
 * lists alive and exposes them as [LiveData] so the lists refresh themselves.
 *
 * Everything touching the database runs on [Dispatchers.IO]; Room throws on
 * main-thread access.
 */
class PdfReaderViewModel(app: Application) : AndroidViewModel(app) {

    private val progressDao: ReadingProgressDao = PdfDatabase.get(app).readingProgressDao()
    private val bookmarkDao: BookmarkDao = PdfDatabase.get(app).bookmarkDao()
    private val noteDao: NoteDao = PdfDatabase.get(app).noteDao()
    private val highlightDao: HighlightDao = PdfDatabase.get(app).highlightDao()

    val prefs: PdfPrefs = PdfPrefs.get(app)

    /** Book currently being read; set once on open. */
    var bookKey: String = ""
        private set

    /** Bookmarks for [bookKey]. */
    private val _bookmarks = MutableLiveData<List<Bookmark>>(emptyList())
    val bookmarks: LiveData<List<Bookmark>> = _bookmarks

    /** Notes for [bookKey]. */
    private val _notes = MutableLiveData<List<Note>>(emptyList())
    val notes: LiveData<List<Note>> = _notes

    /** Highlights for [bookKey]. */
    private val _highlights = MutableLiveData<List<Highlight>>(emptyList())
    val highlights: LiveData<List<Highlight>> = _highlights

    /** Result count for the in-document search, shown next to the search box. */
    private val _searchCount = MutableLiveData(0)
    val searchCount: LiveData<Int> = _searchCount

    /** Saved reading position, or null when the book has never been opened. */
    private val _progress = MutableLiveData<ReadingProgress?>()
    val progress: LiveData<ReadingProgress?> = _progress

    /**
     * Point the ViewModel at a book and start observing its data.
     *
     * Called once from the activity; re-calling with the same key is a no-op
     * because the Flow queries would just re-subscribe to identical queries.
     */
    fun bind(key: String) {
        if (bookKey == key) return
        bookKey = key
        viewModelScope.launch {
            progressDao.observe(key).collect { _progress.value = it }
        }
        viewModelScope.launch {
            bookmarkDao.observeForBook(key).collect { _bookmarks.value = it }
        }
        viewModelScope.launch {
            noteDao.observeForBook(key).collect { _notes.value = it }
        }
        viewModelScope.launch {
            highlightDao.observeForBook(key).collect { _highlights.value = it }
        }
    }

    /**
     * Persist the current position.
     *
     * Debounced by the caller (the activity only calls this when the page
     * settles), because writing on every scroll frame would hammer the disk.
     */
    fun saveProgress(pageIndex: Int, scrollOffset: Float = 0f) {
        val key = bookKey
        viewModelScope.launch {
            progressDao.save(
                ReadingProgress(
                    bookKey = key,
                    pageIndex = pageIndex,
                    scrollOffset = scrollOffset,
                    updatedAt = System.currentTimeMillis()
                )
            )
        }
    }

    /** Read the saved position once, when a book is opened. */
    suspend fun loadProgress(): ReadingProgress? = withContext(Dispatchers.IO) {
        progressDao.get(bookKey)
    }

    // ---- Bookmarks ---------------------------------------------------------

    /**
     * Save or remove the bookmark on [pageIndex].
     *
     * Suspending and returning the resulting state rather than flipping the icon
     * optimistically: the caller shows a confirmation, which should not claim
     * success before the write has actually landed.
     *
     * @param currentlySaved what the UI believes the state to be. Re-reading it
     *   here would cost a second query for a value the caller already holds.
     * @return true if the page is bookmarked after this call.
     */
    suspend fun setBookmark(pageIndex: Int, currentlySaved: Boolean): Boolean =
        withContext(Dispatchers.IO) {
            if (currentlySaved) {
                // Delete by (book, page) rather than by row id: the activity
                // knows which page it is on, not the Bookmark instance.
                bookmarkDao.deleteAt(bookKey, pageIndex)
                false
            } else {
                bookmarkDao.insert(Bookmark(bookKey = bookKey, pageIndex = pageIndex))
                true
            }
        }

    fun deleteBookmark(bookmark: Bookmark) {
        viewModelScope.launch { bookmarkDao.delete(bookmark) }
    }

    // ---- Notes -------------------------------------------------------------

    /**
     * Row id of the note being edited, or null when composing a new one.
     *
     * Held here rather than by the notes dialog so that saving has a single code
     * path for both "create" and "update".
     */
    var editingNoteId: Long? = null

    /**
     * Save the composer's contents.
     *
     * Updates [editingNoteId] when it is set, otherwise inserts a new note on
     * [pageIndex]. Empty bodies are ignored so an accidental blank save cannot
     * create an empty note.
     */
    fun saveNote(pageIndex: Int, body: String) {
        val trimmed = body.trim()
        if (trimmed.isEmpty()) return
        viewModelScope.launch {
            val existingId = editingNoteId
            if (existingId == null) {
                noteDao.insert(Note(bookKey = bookKey, pageIndex = pageIndex, body = trimmed))
            } else {
                // Re-read the row so any change made elsewhere is preserved.
                noteDao.getById(existingId)?.let { note ->
                    noteDao.update(note.copy(body = trimmed, updatedAt = System.currentTimeMillis()))
                }
            }
            editingNoteId = null
        }
    }

    fun updateNote(note: Note) {
        viewModelScope.launch {
            noteDao.update(note.copy(updatedAt = System.currentTimeMillis()))
        }
    }

    fun deleteNote(note: Note) {
        viewModelScope.launch { noteDao.delete(note) }
    }

    // ---- Highlights --------------------------------------------------------

    /**
     * Save a highlight for the given snippet.
     *
     * [snippet] is normalised first: PDF text extraction wraps lines mid-sentence,
     * so raw selections often contain newlines that would never match on reload.
     */
    fun addHighlight(pageIndex: Int, snippet: String, color: Int) {
        val normalised = normaliseSnippet(snippet)
        if (normalised.isEmpty()) return
        viewModelScope.launch {
            highlightDao.insert(
                Highlight(bookKey = bookKey, pageIndex = pageIndex, snippet = normalised, color = color)
            )
        }
    }

    fun deleteHighlight(highlight: Highlight) {
        viewModelScope.launch { highlightDao.delete(highlight) }
    }

    /** Highlights on one page, used to re-apply them after that page renders. */
    suspend fun highlightsOnPage(pageIndex: Int): List<Highlight> = withContext(Dispatchers.IO) {
        highlightDao.forPage(bookKey, pageIndex)
    }

    fun setSearchCount(count: Int) {
        _searchCount.value = count
    }

    companion object {
        /**
         * Collapse whitespace so a highlight survives reload.
         *
         * PDF text layers insert a newline at every visual line break, so
         * "the\nquick brown\nfox" must become "the quick brown fox" to match
         * against extracted text later.
         */
        fun normaliseSnippet(snippet: String): String =
            snippet.replace(Regex("\\s+"), " ").trim()
    }
}