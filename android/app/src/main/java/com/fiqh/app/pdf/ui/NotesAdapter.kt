package com.fiqh.app.pdf.ui

import android.content.Context
import android.text.format.DateUtils
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.fiqh.app.pdf.R
import com.fiqh.app.pdf.data.Note
import com.fiqh.app.pdf.databinding.ItemNoteBinding

/**
 * The reader's notes for the open book.
 *
 * Row tap jumps to the note's page; the edit button loads that note back into
 * the composer at the top of the notes dialog so there is only one place text
 * is ever typed.
 */
class NotesAdapter(
    private val onJumpToPage: (Int) -> Unit,
    private val onEdit: (Note) -> Unit,
    private val onDelete: (Note) -> Unit
) : ListAdapter<Note, NotesAdapter.ViewHolder>(DIFF) {

    class ViewHolder(val binding: ItemNoteBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemNoteBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val note = getItem(position)
        val context = holder.binding.root.context

        holder.binding.noteBody.text = note.body

        // Show how long ago the note was written rather than an absolute date,
        // which stays more useful while skimming back through a book.
        holder.binding.noteTimestamp.text = relativeTime(context, note.updatedAt)

        holder.binding.notePage.text = context.getString(R.string.reader_page_number, note.pageIndex + 1)
        holder.binding.notePage.setOnClickListener { onJumpToPage(note.pageIndex) }
        holder.binding.btnEditNote.setOnClickListener { onEdit(note) }
        holder.binding.btnDeleteNote.setOnClickListener { onDelete(note) }
    }

    private fun relativeTime(context: Context, millis: Long): String =
        DateUtils.getRelativeTimeSpanString(
            millis,
            System.currentTimeMillis(),
            DateUtils.MINUTE_IN_MILLIS,
            DateUtils.FORMAT_ABBREV_RELATIVE
        ).toString()

    private companion object {
        val DIFF = object : DiffUtil.ItemCallback<Note>() {
            override fun areItemsTheSame(old: Note, new: Note) = old.id == new.id
            override fun areContentsTheSame(old: Note, new: Note) = old == new
        }
    }
}