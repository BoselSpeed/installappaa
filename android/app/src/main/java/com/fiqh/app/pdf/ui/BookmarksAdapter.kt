package com.fiqh.app.pdf.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.fiqh.app.R
import com.fiqh.app.databinding.ItemBookmarkBinding

/**
 * List of the reader's saved pages for the open book.
 *
 * Uses [ListAdapter] + DiffUtil so jumping between books or saving a bookmark
 * animates the row in instead of rebinding the whole list, which matters because
 * a long book can accumulate hundreds of bookmarks.
 */
class BookmarksAdapter(
    /** Invoked with the page to jump to when a row is tapped. */
    private val onJumpToPage: (Int) -> Unit,
    /** Invoked when the delete affordance is pressed. */
    private val onDelete: (com.fiqh.app.pdf.data.Bookmark) -> Unit
) : ListAdapter<com.fiqh.app.pdf.data.Bookmark, BookmarksAdapter.ViewHolder>(DIFF) {

    class ViewHolder(val binding: ItemBookmarkBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemBookmarkBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val bookmark = getItem(position)
        val context = holder.binding.root.context

        // A bookmark may or may not carry a label; fall back to its page number.
        val label = bookmark.label?.takeIf { it.isNotBlank() }
            ?: context.getString(R.string.reader_page_number, bookmark.pageIndex + 1)
        holder.binding.bookmarkLabel.text = label

        // Tapping anywhere on the row (except the delete button) navigates.
        holder.binding.root.setOnClickListener { onJumpToPage(bookmark.pageIndex) }
        holder.binding.btnDeleteBookmark.setOnClickListener { onDelete(bookmark) }
    }

    private companion object {
        val DIFF = object : DiffUtil.ItemCallback<com.fiqh.app.pdf.data.Bookmark>() {
            override fun areItemsTheSame(
                old: com.fiqh.app.pdf.data.Bookmark,
                new: com.fiqh.app.pdf.data.Bookmark
            ) = old.id == new.id

            override fun areContentsTheSame(
                old: com.fiqh.app.pdf.data.Bookmark,
                new: com.fiqh.app.pdf.data.Bookmark
            ) = old == new
        }
    }
}