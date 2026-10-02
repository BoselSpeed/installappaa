package com.fiqh.app.pdf.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * Room database holding everything the reader persists for a book:
 * reading position, bookmarks, notes and highlights.
 *
 * A single database is used for all books rather than one per book, with
 * [ReadingProgress.bookKey] acting as the discriminator. Per-book databases
 * would mean N file handles and N migrations.
 */
@Database(
    entities = [
        ReadingProgress::class,
        Bookmark::class,
        Note::class,
        Highlight::class
    ],
    version = 1,
    exportSchema = true
)
abstract class PdfDatabase : RoomDatabase() {

    abstract fun readingProgressDao(): ReadingProgressDao
    abstract fun bookmarkDao(): BookmarkDao
    abstract fun noteDao(): NoteDao
    abstract fun highlightDao(): HighlightDao

    companion object {
        private const val DB_NAME = "pdf_reader.db"

        @Volatile
        private var instance: PdfDatabase? = null

        /**
         * Process-wide singleton.
         *
         * Double-checked locking because the reader and the Capacitor plugin can
         * both reach the database, and opening two Room instances on the same
         * file would fight over the connection pool.
         */
        fun get(context: Context): PdfDatabase =
            instance ?: synchronized(this) {
                instance ?: build(context.applicationContext).also { instance = it }
            }

        private fun build(context: Context): PdfDatabase =
            Room.databaseBuilder(context, PdfDatabase::class.java, DB_NAME)
                // No fallbackToDestructiveMigration: silently wiping a reader's
                // bookmarks and notes on a schema bump would lose their work.
                // Every future version must ship a real Migration.
                .build()
    }
}