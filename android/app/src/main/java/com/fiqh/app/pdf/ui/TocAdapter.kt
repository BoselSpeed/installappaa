package com.fiqh.app.pdf.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.fiqh.app.databinding.ItemTocBinding
import com.shockwave.pdfium.PdfDocument

/**
 * Table of contents for the open book.
 *
 * Entries come from the PDF outline, which only a tagged (bookmarked) PDF
 * carries; a scanned book returns an empty list and the activity offers the
 * numeric page jump instead.
 *
 * [onEntryClick] receives the destination page index, which is what the activity
 * jumps to. Nesting is flattened into [TocEntry] with a depth, because the
 * outline is a tree and the item layout expresses hierarchy as indentation.
 */
class TocAdapter(
    private val onEntryClick: (Int) -> Unit
) : ListAdapter<TocEntry, TocAdapter.ViewHolder>(DIFF) {

    class ViewHolder(val binding: ItemTocBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTocBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val entry = getItem(position)

        // Outline titles can be null in a partially-tagged PDF, so fall back to a
        // generic label rather than leaving the row blank.
        holder.binding.tocTitle.text = entry.title

        // The outline stores an absolute page index; readers count from 1.
        holder.binding.tocPage.text = (entry.pageIndex + 1).toString()

        // Sections nest, so the depth becomes indentation instead of a bullet
        // column: one visual cue is enough, and it costs no extra width.
        val indent = (entry.depth * INDENT_DP) * holder.binding.root.resources
            .displayMetrics.density
        holder.binding.tocTitle.setPadding(
            indent.toInt(),
            holder.binding.tocTitle.paddingTop,
            holder.binding.tocTitle.paddingRight,
            holder.binding.tocTitle.paddingBottom
        )

        holder.binding.root.setOnClickListener { onEntryClick(entry.pageIndex) }
    }

    private companion object {
        const val INDENT_DP = 14

        val DIFF = object : DiffUtil.ItemCallback<TocEntry>() {
            override fun areItemsTheSame(old: TocEntry, new: TocEntry) =
                old.pageIndex == new.pageIndex && old.title == new.title

            override fun areContentsTheSame(old: TocEntry, new: TocEntry) =
                old == new
        }
    }
}

/** One flattened outline row. */
data class TocEntry(
    val title: String,
    val pageIndex: Int,
    val depth: Int
)

/**
 * Flatten a PDF outline tree into a display list.
 *
 * The order is preserved rather than sorted: an outline is authored in reading
 * order, and sorting by page would break entries that deliberately point
 * backwards or to an appendix.
 */
fun List<PdfDocument.Bookmark>.flatten(): List<TocEntry> {
    val out = mutableListOf<TocEntry>()

    fun walk(bookmarks: List<PdfDocument.Bookmark>, depth: Int) {
        bookmarks.forEach { bookmark ->
            val page = bookmark.pageIdx
            // A negative index is the PDF's way of saying "no destination".
            if (page >= 0) {
                out += TocEntry(
                    title = bookmark.title?.takeIf { it.isNotBlank() } ?: "",
                    pageIndex = page.toInt(),
                    depth = depth
                )
            }
            bookmark.children?.let { walk(it, depth + 1) }
        }
    }

    walk(this, 0)
    return out
}