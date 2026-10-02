package com.fiqh.app.pdf.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

/**
 * Reading position for every book, one row per book.
 *
 * All reads/writes are suspending or Flow-based so they run off the main thread;
 * Room refuses main-thread queries.
 */
@Dao
interface ReadingProgressDao {

    /** Observe the saved position of one book. Emits null when never opened. */
    @Query("SELECT * FROM reading_progress WHERE book_key = :bookKey LIMIT 1")
    fun observe(bookKey: String): Flow<ReadingProgress?>

    /** One-shot read, used when restoring a book on open. */
    @Query("SELECT * FROM reading_progress WHERE book_key = :bookKey LIMIT 1")
    suspend fun get(bookKey: String): ReadingProgress?

    /**
     * Save the position for a book.
     *
     * REPLACE on the unique book_key index is what makes this an upsert: saving
     * again updates the same row instead of accumulating duplicates.
     */
    @Upsert
    suspend fun save(progress: ReadingProgress)

    /** Drop saved positions, used by the reader's "clear" action. */
    @Query("DELETE FROM reading_progress")
    suspend fun clear()
}

/**
 * User bookmarks.
 *
 * Every query is scoped by book so a book's list never leaks another's, and all
 * lists are ordered by page so "jump to page" ordering matches what the reader
 * sees.
 */
@Dao
interface BookmarkDao {

    @Query("SELECT * FROM bookmarks WHERE book_key = :bookKey ORDER BY page_index ASC")
    fun observeForBook(bookKey: String): Flow<List<Bookmark>>

    /**
     * One-shot read of a book's bookmarks.
     *
     * The plugin's listBookmarks() call is a request/response, not a lifecycle
     * observer, so it cannot collect the Flow above.
     */
    @Query("SELECT * FROM bookmarks WHERE book_key = :bookKey ORDER BY page_index ASC")
    suspend fun observeForBookOnce(bookKey: String): List<Bookmark>

    /** Page indexes only, so the reader can draw markers in the page gutter. */
    @Query("SELECT page_index FROM bookmarks WHERE book_key = :bookKey ORDER BY page_index ASC")
    suspend fun pagesForBook(bookKey: String): List<Int>

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE book_key = :bookKey AND page_index = :pageIndex)")
    suspend fun exists(bookKey: String, pageIndex: Int): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(bookmark: Bookmark): Long

    @Delete
    suspend fun delete(bookmark: Bookmark)

    /**
     * Remove the bookmark on a given page.
     *
     * Used when toggling, where the caller knows the page but not the row id.
     */
    @Query("DELETE FROM bookmarks WHERE book_key = :bookKey AND page_index = :pageIndex")
    suspend fun deleteAt(bookKey: String, pageIndex: Int)

    @Query("DELETE FROM bookmarks WHERE book_key = :bookKey")
    suspend fun clearForBook(bookKey: String)
}

/**
 * Reader notes, anchored to the page they were written on.
 */
@Dao
interface NoteDao {

    /** Newest first, so the most recent thought is always at the top. */
    @Query("SELECT * FROM notes WHERE book_key = :bookKey ORDER BY created_at DESC")
    fun observeForBook(bookKey: String): Flow<List<Note>>

    @Query("SELECT COUNT(*) FROM notes WHERE book_key = :bookKey")
    fun observeCount(bookKey: String): Flow<Int>

    /** One-shot read, used when editing a note so its current body can be shown. */
    @Query("SELECT * FROM notes WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): Note?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(note: Note): Long

    @Update
    suspend fun update(note: Note)

    @Delete
    suspend fun delete(note: Note)

    @Query("DELETE FROM notes WHERE book_key = :bookKey")
    suspend fun clearForBook(bookKey: String)
}

/**
 * Saved text highlights.
 */
@Dao
interface HighlightDao {

    @Query("SELECT * FROM highlights WHERE book_key = :bookKey ORDER BY page_index ASC")
    fun observeForBook(bookKey: String): Flow<List<Highlight>>

    /** Highlights on one page, used to re-apply them after the page renders. */
    @Query("SELECT * FROM highlights WHERE book_key = :bookKey AND page_index = :pageIndex")
    suspend fun forPage(bookKey: String, pageIndex: Int): List<Highlight>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(highlight: Highlight): Long

    @Delete
    suspend fun delete(highlight: Highlight)

    @Query("DELETE FROM highlights WHERE book_key = :bookKey")
    suspend fun clearForBook(bookKey: String)
}