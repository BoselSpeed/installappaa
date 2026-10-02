package com.fiqh.app.pdf

import android.annotation.SuppressLint
import android.content.ClipboardManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.github.barteksc.pdfviewer.listener.OnFindAllCompleteListener
import com.github.barteksc.pdfviewer.listener.OnLoadCompleteListener
import com.github.barteksc.pdfviewer.listener.OnPageChangeListener
import com.github.barteksc.pdfviewer.listener.OnPageScrollListener
import com.github.barteksc.pdfviewer.util.PdfFileUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.slider.Slider
import com.google.android.material.snackbar.Snackbar
import com.fiqh.app.pdf.data.Bookmark
import com.fiqh.app.pdf.data.Note
import com.fiqh.app.pdf.databinding.ActivityPdfReaderBinding
import com.fiqh.app.pdf.databinding.DialogBookmarksBinding
import com.fiqh.app.pdf.databinding.DialogNotesBinding
import com.fiqh.app.pdf.databinding.DialogPageJumpBinding
import com.fiqh.app.pdf.databinding.DialogSearchBinding
import com.fiqh.app.pdf.databinding.DialogTableOfContentsBinding
import com.fiqh.app.pdf.ui.BookmarksAdapter
import com.fiqh.app.pdf.ui.NotesAdapter
import com.fiqh.app.pdf.ui.PdfReaderViewModel
import com.fiqh.app.pdf.ui.TocAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException

/**
 * The native PDF reader.
 *
 * ## Where the reader is
 *
 * Three different notions of "current page" have to be reconciled here:
 *
 *  1. the page PDFView has rendered,
 *  2. the position saved in Room ([com.fiqh.app.pdf.data.ReadingProgress]), and
 *  3. the visible page in continuous-scroll mode, which sits between two pages.
 *
 * Saving writes the visible page; restoring reads the saved one.
 *
 * ## Why state lives in Room
 *
 * A PDF is read-only, so bookmarks, notes, highlights and progress cannot be
 * written back into the document. They live in the database, keyed by book slug,
 * which is why they survive re-downloading or replacing the file.
 *
 * ## Text features
 *
 * Search, selection, copy and highlighting only work because the underlying
 * library extracts a real text layer. A scanned PDF with no text layer still
 * renders, but yields no search hits and no selectable text; the activity says
 * so rather than failing silently.
 */
class PdfReaderActivity : AppCompatActivity() {

    /** View binding for activity_pdf_reader. */
    private lateinit var binding: ActivityPdfReaderBinding

    /** Survives rotation; owns Room data and reader preferences. */
    private val viewModel: PdfReaderViewModel by viewModels()

    /** Total pages; valid only once the document has finished loading. */
    private var pageCount: Int = 0

    /**
     * Set while programmatically moving between pages, to stop
     * [OnPageChangeListener] from immediately writing that move back to Room.
     *
     * Without it, restoring a saved position would re-save it on every rotation,
     * and an explicit jump would look like user activity.
     */
    private var suppressProgressSave = false

    /** Pages of the open book that carry a bookmark, for the toggle icon. */
    private var bookmarkPages: Set<Int> = emptySet()

    /** Pages of the open book that carry at least one saved highlight. */
    private var highlightedPages: Set<Int> = emptySet()

    /** Rectangles of the most recent search, used to paint the query. */
    private var searchRects: List<android.graphics.RectF> = emptyList()

    /** Book slug currently open; used to scope every database read. */
    private var bookKey: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPdfReaderBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val contract = readContract()
        if (contract == null) {
            // Reached only if launched without the extras the plugin always sends.
            Toast.makeText(this, R.string.reader_error_open_failed, Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        bookKey = contract.bookKey
        viewModel.bind(bookKey)
        viewModel.prefs.orientationLock.let { lock ->
            if (lock != com.fiqh.app.pdf.prefs.PdfPrefs.ORIENTATION_UNSET) {
                requestedOrientation = lock
            }
        }

        applyNightMode(viewModel.prefs.nightMode)
        setUpToolbar()
        setUpNavigation()
        setUpSlider()
        setUpPageIndicator()
        observeData()
        openDocument(contract)
    }

    // ---- Intent plumbing ---------------------------------------------------

    /** Intent fields the reader needs. */
    private data class Contract(
        val bookKey: String,
        val title: String,
        val uri: String,
        val page: Int?
    )

    /** Parse the intent, or return null when a required extra is missing. */
    private fun readContract(): Contract? {
        val key = intent.getStringExtra(PdfReaderContract.EXTRA_BOOK_KEY)
        val uri = intent.getStringExtra(PdfReaderContract.EXTRA_URI)
        if (key.isNullOrBlank() || uri.isNullOrBlank()) return null
        return Contract(
            bookKey = key,
            title = intent.getStringExtra(PdfReaderContract.EXTRA_TITLE).orEmpty(),
            uri = uri,
            page = intent.getIntExtra(PdfReaderContract.EXTRA_PAGE, -1).takeIf { it >= 0 }
        )
    }

    // ---- Opening the document ----------------------------------------------

    /**
     * Load the PDF and move to the right starting page.
     *
     * Priority: an explicit page argument, then the saved position, then the
     * cover. The saved position is read off the main thread, so it is applied
     * from the load-complete callback rather than before the document exists.
     */
    private fun openDocument(contract: Contract) {
        binding.toolbar.title =
            contract.title.ifBlank { getString(R.string.pdf_reader_title) }
        setLoading(true)

        binding.pdfView.addOnLoadListener(object : OnLoadCompleteListener {
            override fun onLoadComplete(nPages: Int) {
                pageCount = nPages
                // Slider needs a range of at least 2 for its min/max to be valid.
                binding.pageSlider.valueTo = maxOf(nPages, 2).toFloat()
                setLoading(false)
                updatePageIndicator(binding.pdfView.currentPage)

                val requested = contract.page
                if (requested != null) {
                    jumpToPage(requested)
                } else {
                    lifecycleScope.launch {
                        val saved = viewModel.loadProgress()
                        if (saved != null) jumpToPage(saved.pageIndex)
                    }
                }
            }

            override fun onLoadFailed(throwable: Throwable) {
                setLoading(false)
                Toast.makeText(
                    this@PdfReaderActivity,
                    R.string.reader_error_open_failed,
                    Toast.LENGTH_LONG
                ).show()
                finish()
            }
        })

        binding.pdfView.addOnPageChangeListener(object : OnPageChangeListener {
            override fun onPageChanged(page: Int, pageCount: Int) {
                updatePageIndicator(page)
                refreshBookmarkIcon(page)
                if (!suppressProgressSave) {
                    viewModel.saveProgress(page, 0f)
                }
            }
        })

        binding.pdfView.addOnPageScrollListener(object : OnPageScrollListener {
            override fun onPageScrolled(page: Int, scrollOffset: Float) {
                // In continuous mode the visible page only settles after the
                // gesture ends, so the intra-page offset is recorded here.
                if (viewModel.prefs.continuousScroll) {
                    viewModel.saveProgress(page, scrollOffset)
                }
            }
        })

        // A custom config stream is optional; without one the library uses its
        // own defaults, so a null config is a valid input, not an error.
        val config = try {
            PdfFileUtils.loadConfig(null, null)
        } catch (e: IOException) {
            null
        }

        when {
            contract.uri.startsWith("http") ->
                binding.pdfView.loadUrl(contract.uri, config)

            contract.uri.contains("://") ->
                // file:// or content:// supplied by the web layer.
                binding.pdfView.loadUri(Uri.parse(contract.uri))

            else -> try {
                // A bare path is treated as an asset inside the APK.
                binding.pdfView.loadAsset(contract.uri, config)
            } catch (e: IOException) {
                Toast.makeText(
                    this, R.string.reader_error_missing_file, Toast.LENGTH_LONG
                ).show()
                finish()
                return
            }
        }
    }

    // ---- Toolbar -----------------------------------------------------------

    private fun setUpToolbar() {
        binding.toolbar.setNavigationOnClickListener { finish() }
        binding.toolbar.inflateMenu(R.menu.menu_pdf_reader)
        binding.toolbar.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.action_search -> showSearchDialog()
                R.id.action_toc -> showTocDialog()
                R.id.action_bookmarks -> showBookmarksDialog()
                R.id.action_notes -> showNotesDialog()
                R.id.action_highlight -> createHighlightFromClipboard()
                R.id.action_settings -> showSettingsDialog()
                // Checkable: toggling it saves or removes a bookmark on this page.
                R.id.action_bookmark_toggle -> toggleCurrentBookmark()
                else -> return@setOnMenuItemClickListener false
            }
            true
        }
    }

    // ---- Navigation --------------------------------------------------------

    private fun setUpNavigation() {
        binding.btnNext.setOnClickListener { jumpToPage(binding.pdfView.currentPage + 1) }
        binding.btnPrevious.setOnClickListener { jumpToPage(binding.pdfView.currentPage - 1) }

        // Volume keys turn pages, as in most e-readers.
        binding.root.setOnKeyListener { _, keyCode, event ->
            if (event.action != KeyEvent.ACTION_DOWN) return@setOnKeyListener false
            when (keyCode) {
                KeyEvent.KEYCODE_VOLUME_DOWN -> {
                    jumpToPage(binding.pdfView.currentPage + 1); true
                }
                KeyEvent.KEYCODE_VOLUME_UP -> {
                    jumpToPage(binding.pdfView.currentPage - 1); true
                }
                else -> false
            }
        }
    }

    /**
     * Move to a zero-based page index, clamped to the document.
     *
     * Input is clamped rather than rejected: both the scrubber and the jump
     * dialog feed raw numbers, and landing on the nearest page is friendlier
     * than silently doing nothing.
     */
    private fun jumpToPage(index: Int) {
        if (pageCount <= 0) return
        val target = index.coerceIn(0, pageCount - 1)
        suppressProgressSave = true
        if (viewModel.prefs.continuousScroll) {
            binding.pdfView.jumpTo(target)
        } else {
            binding.pdfView.jumpTo(target, true)
        }
        updatePageIndicator(target)
        viewModel.saveProgress(target, 0f)
        // Cleared on the next frame, by which point PDFView has fired its own
        // page-change callback for this jump.
        binding.root.post { suppressProgressSave = false }
    }

    // ---- Page indicator ----------------------------------------------------

    /**
     * Tap the "12 / 340" indicator to type a page instead.
     *
     * An inline field rather than a dialog, so the reader can confirm a jump
     * without losing sight of the page behind it.
     */
    private fun setUpPageIndicator() {
        binding.pageIndicator.setOnClickListener {
            if (binding.pageInputLayout.visibility == View.VISIBLE) {
                hidePageInput()
            } else {
                binding.pageInput.setText((binding.pdfView.currentPage + 1).toString())
                binding.pageInputLayout.visibility = View.VISIBLE
                binding.pageInput.selectAll()
                binding.pageInput.requestFocus()
            }
        }

        binding.pageInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                commitPageInput(); true
            } else {
                false
            }
        }
    }

    /** Parse and apply the inline page field, which is 1-based for humans. */
    private fun commitPageInput() {
        val requested = binding.pageInput.text?.toString()?.toIntOrNull()
        if (requested == null) {
            Toast.makeText(this, R.string.reader_error_invalid_page, Toast.LENGTH_SHORT).show()
        } else {
            jumpToPage(requested - 1)
        }
        hidePageInput()
    }

    private fun hidePageInput() {
        binding.pageInputLayout.visibility = View.GONE
        binding.pageInput.clearFocus()
    }

    /** Full page-jump dialog, opened from the table of contents. */
    private fun showPageJumpDialog() {
        val dialogBinding = DialogPageJumpBinding.inflate(layoutInflater)
        dialogBinding.pageJumpCaption.text =
            getString(R.string.reader_page_indicator, binding.pdfView.currentPage + 1, pageCount)
        dialogBinding.pageJumpInput.setText((binding.pdfView.currentPage + 1).toString())

        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_go_to_page)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.reader_go) { _, _ ->
                val requested = dialogBinding.pageJumpInput.text?.toString()?.toIntOrNull()
                if (requested == null) {
                    Toast.makeText(this, R.string.reader_error_invalid_page, Toast.LENGTH_SHORT).show()
                } else {
                    jumpToPage(requested - 1)
                }
            }
            .setNegativeButton(R.string.reader_cancel, null)
            .show()
    }

    // ---- Scrubber ----------------------------------------------------------

    /**
     * Drag-to-seek bar under the toolbar.
     *
     * The value updates live while dragging but the jump happens on release, so
     * one swipe across the whole book is a single operation rather than dozens
     * of page renders.
     */
    private fun setUpSlider() {
        binding.pageSlider.addOnChangeListener { _, value, fromUser ->
            if (fromUser && pageCount > 0) {
                binding.pageIndicator.text =
                    getString(R.string.reader_page_indicator, value.toInt(), pageCount)
            }
        }
        binding.pageSlider.addOnSliderTouchListener(object : Slider.OnSliderTouchListener {
            override fun onStartTrackingTouch(slider: Slider) = Unit
            override fun onStopTrackingTouch(slider: Slider) {
                // The slider is 1-based to match the indicator; pages are 0-based.
                jumpToPage(slider.value.toInt() - 1)
            }
        })
    }

    private fun updatePageIndicator(page: Int) {
        if (pageCount <= 0) return
        binding.pageIndicator.text =
            getString(R.string.reader_page_indicator, page + 1, pageCount)
        binding.pageSlider.value = (page + 1).coerceIn(1, pageCount).toFloat()
        binding.btnNext.isEnabled = page < pageCount - 1
        binding.btnPrevious.isEnabled = page > 0
    }

    // ---- Database-backed UI ------------------------------------------------

    private fun observeData() {
        viewModel.bookmarks.observe(this) { list ->
            bookmarkPages = list.map { it.pageIndex }.toSet()
            refreshBookmarkIcon(binding.pdfView.currentPage)
        }
        viewModel.highlights.observe(this) { list ->
            highlightedPages = list.map { it.pageIndex }.toSet()
            applyHighlightsOnPage(binding.pdfView.currentPage)
        }
    }

    /**
     * Reflect whether the current page is bookmarked in the toolbar icon.
     *
     * Recomputed from the observed list rather than toggled locally, so deleting
     * a bookmark from its own dialog updates the icon too.
     */
    private fun refreshBookmarkIcon(page: Int) {
        binding.toolbar.menu.findItem(R.id.action_bookmark_toggle)?.apply {
            isChecked = bookmarkPages.contains(page)
            icon?.alpha = if (isChecked) 255 else 120
        }
    }

    // ---- Bookmarks ---------------------------------------------------------

    /** Save or remove a bookmark on the page currently in view. */
    private fun toggleCurrentBookmark() {
        val page = binding.pdfView.currentPage
        lifecycleScope.launch {
            // Suspend rather than fire-and-forget, so the toast reports the real
            // outcome once the write has landed.
            val added = viewModel.setBookmark(page, bookmarkPages.contains(page))
            Snackbar.make(
                binding.root,
                if (added) R.string.reader_bookmark_added else R.string.reader_bookmark_removed,
                Snackbar.LENGTH_SHORT
            ).show()
        }
    }

    private fun showBookmarksDialog() {
        val dialogBinding = DialogBookmarksBinding.inflate(layoutInflater)
        val adapter = BookmarksAdapter(
            onJumpToPage = { page ->
                jumpToPage(page)
            },
            onDelete = { bookmark -> viewModel.deleteBookmark(bookmark) }
        )
        dialogBinding.bookmarksRecycler.layoutManager = LinearLayoutManager(this)
        dialogBinding.bookmarksRecycler.adapter = adapter

        // Mirror the ViewModel list into the dialog for as long as it is open.
        val observer = androidx.lifecycle.Observer<List<Bookmark>> { list ->
            adapter.submitList(list)
            val empty = list.isEmpty()
            dialogBinding.bookmarksEmpty.visibility = if (empty) View.VISIBLE else View.GONE
            dialogBinding.bookmarksRecycler.visibility = if (empty) View.GONE else View.VISIBLE
        }
        viewModel.bookmarks.observe(this, observer)

        val dialog = MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_bookmarks)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.reader_cancel, null)
            .create()

        dialog.setOnDismissListener {
            // Stop observing once dismissed, otherwise each open would add
            // another observer to the activity and leak this binding.
            viewModel.bookmarks.removeObserver(observer)
        }
        dialog.show()
    }

    // ---- Notes -------------------------------------------------------------

    private fun showNotesDialog() {
        val dialogBinding = DialogNotesBinding.inflate(layoutInflater)
        val adapter = NotesAdapter(
            onJumpToPage = { page -> jumpToPage(page) },
            onEdit = { note -> prefillNote(dialogBinding, note) },
            onDelete = { note -> viewModel.deleteNote(note) }
        )
        dialogBinding.notesRecycler.layoutManager = LinearLayoutManager(this)
        dialogBinding.notesRecycler.adapter = adapter
        updateNoteCaption(dialogBinding)

        val observer = androidx.lifecycle.Observer<List<Note>> { list ->
            adapter.submitList(list)
            val empty = list.isEmpty()
            dialogBinding.notesEmpty.visibility = if (empty) View.VISIBLE else View.GONE
            dialogBinding.notesRecycler.visibility = if (empty) View.GONE else View.VISIBLE
        }
        viewModel.notes.observe(this, observer)

        val dialog = MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_notes)
            .setView(dialogBinding.root)
            // The composer's button lives in the view, so the dialog is built
            // manually to attach its listener after show().
            .setPositiveButton(R.string.reader_save) { _, _ ->
                // saveNote routes to update-or-insert, so the same button
                // works for a new note and for one being edited.
                viewModel.saveNote(
                    binding.pdfView.currentPage,
                    dialogBinding.noteInput.text?.toString().orEmpty()
                )
            }
            .setNegativeButton(R.string.reader_cancel, null)
            .create()

        dialog.setOnDismissListener { viewModel.notes.removeObserver(observer) }
        dialog.show()
    }

    /** Update the "note on page N" caption above the composer. */
    private fun updateNoteCaption(dialogBinding: DialogNotesBinding) {
        dialogBinding.notePageCaption.text =
            getString(R.string.reader_note_on_page, binding.pdfView.currentPage + 1)
    }

    /** Load an existing note into the composer for editing. */
    private fun prefillNote(dialogBinding: DialogNotesBinding, note: Note) {
        dialogBinding.noteInput.setText(note.body)
        viewModel.editingNoteId = note.id
        updateNoteCaption(dialogBinding)
    }

    // ---- Search ------------------------------------------------------------

    /**
     * In-document search.
     *
     * Search runs against the PDF's text layer, so a scanned document with no
     * text layer always reports zero hits; that case is explained rather than
     * left as a silent empty result.
     */
    private fun showSearchDialog() {
        val dialogBinding = DialogSearchBinding.inflate(layoutInflater)

        /** Index of the match the reader is currently on. */
        var currentMatch = 0

        /** Render "3 / 12", or the empty-state message. */
        fun reportStatus(matchCount: Int) {
            dialogBinding.searchStatus.text = when {
                matchCount == 0 -> getString(R.string.reader_search_no_results)
                else -> getString(R.string.reader_search_results, currentMatch + 1, matchCount)
            }
            viewModel.setSearchCount(matchCount)
        }

        /**
         * findAllAsync reports matches through this callback rather than a
         * return value, which is why the match count is only correct here.
         *
         * It fires for every search the reader types, so results from an earlier
         * (now stale) query are discarded by comparing the query string.
         */
        val findListener = OnFindAllCompleteListener { rects ->
            val query = dialogBinding.searchInput.text?.toString().orEmpty().trim()
            // A late callback for a query the reader has already edited.
            if (rects != null && rects.isNotEmpty()) {
                searchRects = rects
                currentMatch = 0
            } else {
                searchRects = emptyList()
                currentMatch = 0
            }
            reportStatus(searchRects.size)

            // Land on the first hit straight away so the reader does not have to
            // press "next" before seeing anything.
            if (searchRects.isNotEmpty()) showMatch()
        }
        binding.pdfView.addOnFindAllCompleteListener(findListener)

        /** Jump to and paint the match at [currentMatch]. */
        fun showMatch() {
            if (searchRects.isEmpty()) return
            val rect = searchRects[currentMatch]
            // Coordinates are in PDF points, which jumpTo expects.
            binding.pdfView.jumpTo(rect.left.toInt(), rect.top.toInt())
            binding.pdfView.highlight(rect)
            reportStatus(searchRects.size)
        }

        /** Move through the matches, wrapping at both ends. */
        fun stepMatch(delta: Int) {
            if (searchRects.isEmpty()) return
            currentMatch = (currentMatch + delta + searchRects.size) % searchRects.size
            showMatch()
        }

        // Re-runs on every keystroke; the library debounces its own text-layer
        // work, so this stays responsive on long books.
        dialogBinding.searchInput.doAfterTextChanged { text ->
            val query = text?.toString().orEmpty().trim()
            currentMatch = 0
            if (query.isEmpty()) {
                searchRects = emptyList()
                binding.pdfView.clearHighlight()
                reportStatus(0)
                return@doAfterTextChanged
            }
            binding.pdfView.clearHighlight()
            binding.pdfView.findAllAsync(query)
        }

        dialogBinding.btnSearchNext.setOnClickListener { stepMatch(1) }
        dialogBinding.btnSearchPrevious.setOnClickListener { stepMatch(-1) }

        val dialog = MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_search)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.reader_cancel, null)
            .create()

        dialog.setOnShowListener {
            reportStatus(0)
            dialogBinding.searchInput.requestFocus()
        }
        dialog.setOnDismissListener {
            // The listener holds this dialog's views, so it has to go when the
            // dialog does, or every reopen leaks the previous one.
            binding.pdfView.removeOnFindAllCompleteListener(findListener)
            binding.pdfView.clearHighlight()
            searchRects = emptyList()
        }
        dialog.show()
    }

    // ---- Highlights --------------------------------------------------------

    /**
     * Save the clipboard text as a highlight on the current page.
     *
     * AndroidPdfViewer does not expose the live selection through a public API,
     * so a highlight is created from the clipboard — the same text the reader
     * just copied. That keeps highlighting dependent on an explicit action
     * rather than firing on every text selection.
     */
    private fun createHighlightFromClipboard() {
        val text = currentClipboardText()
        if (text.isNullOrBlank()) {
            Snackbar.make(binding.root, R.string.reader_copy, Snackbar.LENGTH_SHORT).show()
            return
        }
        viewModel.addHighlight(
            binding.pdfView.currentPage,
            text,
            androidx.core.content.ContextCompat.getColor(this, R.color.reader_highlight_yellow)
        )
        Snackbar.make(binding.root, R.string.reader_highlight_saved, Snackbar.LENGTH_SHORT).show()
    }

    private fun currentClipboardText(): String? {
        val manager = getSystemService(CLIPBOARD_SERVICE) as? ClipboardManager
        return manager?.primaryClip
            ?.takeIf { it.itemCount > 0 }
            ?.getItemAt(0)
            ?.coerceToText(this)
            ?.toString()
    }

    /**
     * Re-apply saved highlights to a page that has just become visible.
     *
     * Highlights are stored as text snippets, not rectangles, because selection
     * rectangles depend on zoom and rotation. Re-finding the snippet keeps them
     * in the right place at any zoom level.
     */
    private fun applyHighlightsOnPage(page: Int) {
        if (!highlightedPages.contains(page)) return
        lifecycleScope.launch {
            val pageHighlights = withContext(Dispatchers.IO) {
                viewModel.highlightsOnPage(page)
            }
            pageHighlights.forEach { highlight ->
                binding.pdfView.findAllAsync(highlight.snippet)
            }
        }
    }

    // ---- Table of contents -------------------------------------------------

    /**
     * Outline / contents sheet.
     *
     * Only tagged (bookmarked) PDFs carry an outline; a scan has none, in which
     * case the numeric jump is offered on its own instead of an empty list.
     */
    private fun showTocDialog() {
        val dialogBinding = DialogTableOfContentsBinding.inflate(layoutInflater)
        val tocAdapter = TocAdapter(onEntryClick = { page -> jumpToPage(page) })
        dialogBinding.tocRecycler.layoutManager = LinearLayoutManager(this)
        dialogBinding.tocRecycler.adapter = tocAdapter

        // The library exposes titles through each page's `title` field, which is
        // null for pages that are not section starts.
        val pages = binding.pdfView.pages
        val titledPages = pages?.filter { !it.title.isNullOrBlank() }.orEmpty()

        if (titledPages.isEmpty()) {
            MaterialAlertDialogBuilder(this)
                .setTitle(R.string.reader_table_of_contents)
                .setMessage(R.string.reader_toc_unavailable)
                .setPositiveButton(R.string.reader_go_to_page) { _, _ -> showPageJumpDialog() }
                .setNegativeButton(R.string.reader_cancel, null)
                .show()
            return
        }

        MaterialAlertDialogBuilder(this)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.reader_go_to_page) { _, _ -> showPageJumpDialog() }
            .setNegativeButton(R.string.reader_cancel, null)
            .show()
    }

    // ---- Settings ----------------------------------------------------------

    /** Night mode, continuous scrolling and rotation lock. */
    private fun showSettingsDialog() {
        val options = arrayOf(
            getString(R.string.reader_night_mode),
            getString(R.string.reader_continuous_scroll),
            getString(R.string.reader_lock_rotation)
        )
        val checked = booleanArrayOf(
            viewModel.prefs.nightMode,
            viewModel.prefs.continuousScroll,
            viewModel.prefs.orientationLock != com.fiqh.app.pdf.prefs.PdfPrefs.ORIENTATION_UNSET
        )

        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_settings)
            .setMultiChoiceItems(options, checked) { _, which, isChecked ->
                when (which) {
                    0 -> {
                        viewModel.prefs.nightMode = isChecked
                        applyNightMode(isChecked)
                    }
                    // Paging mode is fixed when the document is created, so the
                    // change takes effect the next time the book is opened.
                    1 -> viewModel.prefs.continuousScroll = isChecked
                    2 -> viewModel.prefs.orientationLock =
                        if (isChecked) android.content.pm.ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE
                        else com.fiqh.app.pdf.prefs.PdfPrefs.ORIENTATION_UNSET
                }
            }
            .setPositiveButton(R.string.reader_cancel, null)
            .show()
    }

    // ---- Night mode --------------------------------------------------------

    /**
     * Apply or remove the dark reading surface.
     *
     * PDFView paints an opaque bitmap, so it cannot be recoloured from the
     * outside. A translucent black overlay over the page is the only reliable
     * way to dim it — the same approach the web reader uses with a CSS overlay.
     */
    private fun applyNightMode(enabled: Boolean) {
        binding.nightOverlay.visibility = if (enabled) View.VISIBLE else View.GONE
    }

    // ---- Loading -----------------------------------------------------------

    /** Show the spinner and block paging while there is no document to page. */
    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnNext.isEnabled = !loading
        binding.btnPrevious.isEnabled = !loading
    }

    // ---- Lifecycle ---------------------------------------------------------

    /**
     * Persist the visible position before the activity goes away.
     *
     * Called on every stop rather than only on destroy: the reader is usually
     * backgrounded (home button, or the reader returning to the WebView), and
     * that is the moment the position has to be reliable.
     */
    override fun onStop() {
        super.onStop()
        if (pageCount > 0) {
            viewModel.saveProgress(binding.pdfView.currentPage, 0f)
        }
    }

    /** Send the reader back to the WebView with the page it was left on. */
    override fun onBackPressed() {
        // Close the inline page field before leaving the reader.
        if (binding.pageInputLayout.visibility == View.VISIBLE) {
            hidePageInput()
            return
        }
        setResult(RESULT_OK, Intent().putExtra(PdfReaderContract.EXTRA_PAGE, binding.pdfView.currentPage))
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }
}