package com.fiqh.app.pdf.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.github.barteksc.pdfviewer.listener.PdfRenderer.Page
import com.fiqh.app.pdf.databinding.ItemTocBinding

/**
 * Table of contents for the open book.
 *
 * AndroidPdfViewer's [Page.title] is only populated for PDFs that ship an
 * outline (a tagged/bookmarked PDF); scanned books usually return null, in which
 * case the activity hides this sheet and offers numeric jump only.
 *
 * [onEntryClick] receives the destination page index, which is what
 * [PdfReaderActivity] jumps to.
 */
class TocAdapter(
    private val onEntryClick: (Int) -> Unit
) : ListAdapter<Page, TocAdapter.ViewHolder>(DIFF) {

    class ViewHolder(val binding: ItemTocBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTocBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val page = getItem(position)
        val context = holder.binding.root.context

        // page.title can be null even inside a partially-tagged PDF.
        holder.binding.tocTitle.text = page.title ?: ""
        holder.binding.tocPage.text = (page.index + 1).toString()

        // Pages with a title are section starts; indent nothing and let long
        // titles wrap instead, so a level-based indent is unnecessary here.
        holder.binding.root.setOnClickListener { onEntryClick(page.index) }
    }

    private companion object {
        val DIFF = object : DiffUtil.ItemCallback<Page>() {
            override fun areItemsTheSame(old: Page, new: Page) = old.index == new.index
            override fun areContentsTheSame(old: Page, new: Page) =
                old.index == new.index && old.title == new.title
        }
    }
}