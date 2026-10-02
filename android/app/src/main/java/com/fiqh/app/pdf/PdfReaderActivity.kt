package com.fiqh.app.pdf

import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Bundle
import java.io.File
import java.io.IOException
import java.net.URL
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.fiqh.app.R
import com.fiqh.app.databinding.ActivityPdfReaderBinding
import com.fiqh.app.databinding.DialogBookmarksBinding
import com.fiqh.app.databinding.DialogNotesBinding
import com.fiqh.app.databinding.DialogPageJumpBinding
import com.fiqh.app.databinding.DialogSearchBinding
import com.fiqh.app.databinding.DialogTableOfContentsBinding
import com.fiqh.app.pdf.data.Bookmark
import com.fiqh.app.pdf.data.Note
import com.fiqh.app.pdf.prefs.PdfPrefs
import com.fiqh.app.pdf.search.PdfTextSearch
import com.fiqh.app.pdf.ui.BookmarksAdapter
import com.fiqh.app.pdf.ui.NotesAdapter
import com.fiqh.app.pdf.ui.PdfReaderViewModel
import com.fiqh.app.pdf.ui.TocAdapter
import com.fiqh.app.pdf.ui.flatten
import com.github.barteksc.pdfviewer.PDFView
import com.github.barteksc.pdfviewer.listener.OnErrorListener
import com.github.barteksc.pdfviewer.listener.OnLoadCompleteListener
import com.github.barteksc.pdfviewer.listener.OnPageChangeListener
import com.github.barteksc.pdfviewer.listener.OnPageScrollListener
import com.github.barteksc.pdfviewer.listener.OnRenderListener
import com.github.barteksc.pdfviewer.source.AssetSource
import com.github.barteksc.pdfviewer.source.UriSource
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.slider.Slider
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

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
 * A PDF is read-only, so bookmarks, notes and highlights cannot be written back
 * into the document. They live in the database, keyed by book slug, which is why
 * they survive replacing the file.
 *
 * ## Text search
 *
 * PDFView renders through pdfium, which publishes no text API, so search is
 * served by [PdfTextSearch]: PDFBox reads the text layer once and the activity
 * navigates to the pages that match. That class explains why a hit is a page
 * number rather than a painted rectangle. A scanned book has no text layer at
 * all, and legitimately reports no results.
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

    /** Book slug currently open; used to scope every database read. */
    private var bookKey: String = ""

    /** URI of the open book, kept for the text index. */
    private var documentUri: String = ""

    /**
     * Text index for [documentUri], built on first search and reused after.
     *
     * Null means "not built yet", which is different from "built and empty": a
     * scanned book yields an index with no hits, and rebuilding it per keystroke
     * would re-parse the whole file.
     */
    private var textSearch: PdfTextSearch? = null

    /** Cancelled when the search dialog closes, so a slow parse stops early. */
    private var searchBuildJob: Job? = null

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
        documentUri = contract.uri
        viewModel.bind(bookKey)
        viewModel.prefs.orientationLock.let { lock ->
            if (lock != PdfPrefs.ORIENTATION_UNSET) {
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

        // A network book has to be fetched first: pdfium needs a seekable file,
        // not a stream.
        if (contract.uri.startsWith("http")) {
            openRemote(contract)
            return
        }

        // fromAsset/fromUri return a Configurator, and every rendering option is
        // set on that Configurator rather than on PDFView itself. Chaining off
        // the wrong receiver is why the reader did not compile at first.
        runCatching { configure(binding.pdfView.fromSource(sourceFor(contract.uri)), contract) }
            .onFailure { onOpenFailed() }
    }

    /** Apply the reader's options and listeners to [configurator], then load. */
    private fun configure(configurator: PDFView.Configurator, contract: Contract) {
        val continuous = viewModel.prefs.continuousScroll

        configurator
            .swipeHorizontal(true)
            // Turning snapping off is the whole difference between paged and
            // continuous reading: one page then flows into the next.
            .pageSnap(!continuous)
            .spacing(if (continuous) 0 else PAGE_SPACING_DP)
            .nightMode(viewModel.prefs.nightMode)
            .enableSwipe(true)
            .onLoad(object : OnLoadCompleteListener {
                override fun loadComplete(nPages: Int) {
                    pageCount = nPages
                    // A Slider needs a range of at least 2 for min/max to be valid.
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
            })
            .onError(object : OnErrorListener {
                override fun onError(t: Throwable) {
                    setLoading(false)
                    Toast.makeText(
                        this@PdfReaderActivity,
                        R.string.reader_error_open_failed,
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                }
            })
            .onPageChange(object : OnPageChangeListener {
                override fun onPageChanged(page: Int, pageCount: Int) {
                    updatePageIndicator(page)
                    refreshBookmarkIcon(page)
                    if (!suppressProgressSave) {
                        viewModel.saveProgress(page, 0f)
                    }
                }
            })
            .onPageScroll(object : OnPageScrollListener {
                override fun onPageScrolled(page: Int, scrollOffset: Float) {
                    // In continuous mode the visible page only settles after the
                    // gesture ends, so the intra-page offset is recorded here.
                    if (viewModel.prefs.continuousScroll) {
                        viewModel.saveProgress(page, scrollOffset)
                    }
                }
            })
            .onRender(object : OnRenderListener {
                override fun onInitiallyRendered(nbPages: Int) {
                    // The first paint is where the surface stops being blank,
                    // which can be after loadComplete on a slow document.
                    setLoading(false)
                }
            })
            .load()
    }

    /**
     * Translate the web layer's URI shapes into a PDFView document source.
     *
     * The web bridge rewrites a bundled `/books/x.pdf` into
     * `file:///android_asset/public/books/x.pdf`, which is an AssetManager path
     * rather than a filesystem one; anything else with a scheme belongs to the
     * ContentResolver.
     */
    private fun sourceFor(uri: String) = when {
        uri.startsWith(ASSET_URI_PREFIX) -> AssetSource(uri.removePrefix(ASSET_URI_PREFIX))
        uri.contains("://") -> UriSource(Uri.parse(uri))
        // A bare path is treated as an asset inside the APK.
        else -> AssetSource(uri)
    }

    /**
     * Download a remote book to cache, then open the local copy.
     *
     * pdfium needs a seekable file rather than a stream, so an http(s) book is
     * fetched to cache first; that copy also survives rotation without
     * re-downloading. The transfer runs off the main thread because a
     * several-megabyte book would otherwise block the window for its duration.
     */
    private fun openRemote(contract: Contract) {
        lifecycleScope.launch {
            val cached = withContext(Dispatchers.IO) {
                runCatching {
                    val target = File(cacheDir, "books/${contract.uri.hashCode()}.pdf")
                    target.parentFile?.mkdirs()
                    URL(contract.uri).openStream().use { input ->
                        target.outputStream().use(input::copyTo)
                    }
                    target
                }.getOrNull()
            }

            if (cached == null) {
                onOpenFailed()
                return@launch
            }

            // The options are identical to a local open; only the source differs, which is
            // why both paths end in the same configure() call.
            runCatching { configure(binding.pdfView.fromFile(cached), contract) }
                .onFailure { onOpenFailed() }
        }
    }

    /** Report a book that could not be opened, and leave the reader. */
    private fun onOpenFailed() {
        setLoading(false)
        Toast.makeText(this, R.string.reader_error_open_failed, Toast.LENGTH_LONG).show()
        finish()
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

    /** Full page-jump dialog, offered from the table of contents. */
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
            onJumpToPage = { page -> jumpToPage(page) },
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
     * The index is built once, lazily, on a background thread. Until it exists
     * the dialog says it is indexing rather than reporting zero hits, because
     * "no results" and "not searched yet" are different answers and only one of
     * them is true.
     */
    private fun showSearchDialog() {
        val dialogBinding = DialogSearchBinding.inflate(layoutInflater)

        /** Pages that matched the current query, in reading order. */
        var hits: List<Int> = emptyList()

        /** Index into [hits] of the page currently shown. */
        var currentHit = 0

        /** The query the results on screen belong to. */
        var query = ""

        /** Move through the matches, wrapping at both ends. */
        fun stepMatch(delta: Int) {
            if (hits.isEmpty()) return
            currentHit = (currentHit + delta + hits.size) % hits.size
            val page = hits[currentHit]
            jumpToPage(page)
            dialogBinding.searchStatus.text = getString(
                R.string.reader_search_result_with_page,
                currentHit + 1,
                hits.size,
                page + 1
            )
            dialogBinding.searchSnippet.text = textSearch?.snippet(page, query).orEmpty()
        }

        /** Re-run the query against the index and land on the first hit. */
        fun runSearch(text: String) {
            val index = textSearch
            if (index == null) {
                dialogBinding.searchStatus.text = getString(R.string.reader_search_indexing)
                return
            }
            query = text
            hits = index.findPages(text, dialogBinding.searchWholeWords.isChecked)
            currentHit = 0
            viewModel.setSearchCount(hits.size)

            if (hits.isEmpty()) {
                dialogBinding.searchStatus.text = getString(R.string.reader_search_no_results)
                dialogBinding.searchSnippet.text = ""
                return
            }
            // Land on the first hit straight away so the reader does not have to
            // press "next" before seeing anything.
            stepMatch(0)
        }

        // Build the index the first time search is opened, so the parse cost is
        // paid once rather than on the first keystroke.
        if (textSearch == null) {
            dialogBinding.searchStatus.text = getString(R.string.reader_search_indexing)
            searchBuildJob = lifecycleScope.launch {
                val built = withContext(Dispatchers.IO) {
                    runCatching {
                        PdfTextSearch.build(this@PdfReaderActivity) {
                            PdfTextSearch.streamFor(this@PdfReaderActivity, documentUri).invoke()
                        }
                    }.getOrNull()
                }
                textSearch = built
                if (built == null) {
                    // A book with no readable text layer is a scan: a property
                    // of the file, not a failure of the search.
                    dialogBinding.searchStatus.text =
                        getString(R.string.reader_error_no_text_layer)
                } else {
                    runSearch(dialogBinding.searchInput.text?.toString().orEmpty().trim())
                }
            }
        }

        dialogBinding.searchInput.doAfterTextChanged { text ->
            val typed = text?.toString().orEmpty().trim()
            if (typed.isEmpty()) {
                hits = emptyList()
                currentHit = 0
                dialogBinding.searchStatus.text = getString(R.string.reader_search_hint_empty)
                dialogBinding.searchSnippet.text = ""
                return@doAfterTextChanged
            }
            runSearch(typed)
        }

        dialogBinding.searchWholeWords.setOnCheckedChangeListener { _, _ ->
            val typed = dialogBinding.searchInput.text?.toString().orEmpty().trim()
            if (typed.isNotEmpty()) runSearch(typed)
        }

        dialogBinding.btnSearchNext.setOnClickListener { stepMatch(1) }
        dialogBinding.btnSearchPrevious.setOnClickListener { stepMatch(-1) }

        val dialog = MaterialAlertDialogBuilder(this)
            .setTitle(R.string.reader_search)
            .setView(dialogBinding.root)
            .setPositiveButton(R.string.reader_cancel, null)
            .create()

        dialog.setOnDismissListener {
            // The callbacks above close over this dialog's views, so the parse
            // has to stop when it does, or every reopen leaks the previous one.
            searchBuildJob?.cancel()
        }
        dialog.show()
    }

    // ---- Highlights --------------------------------------------------------

    /**
     * Save the clipboard text as a highlight on the current page.
     *
     * PDFView does not expose the live selection through a public API, so a
     * highlight is created from the clipboard, which is the text the reader just
     * copied. That keeps highlighting dependent on an explicit action rather
     * than firing on every selection the library happens to make.
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
            ContextCompat.getColor(this, R.color.reader_highlight_yellow)
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

    // ---- Table of contents -------------------------------------------------

    /**
     * Outline / contents sheet, read from the PDF's own outline.
     *
     * Only a tagged (bookmarked) PDF carries one; a scan has none, in which case
     * the numeric jump is offered on its own instead of an empty list.
     */
    private fun showTocDialog() {
        val entries = binding.pdfView.tableOfContents.flatten()

        if (entries.isEmpty()) {
            MaterialAlertDialogBuilder(this)
                .setTitle(R.string.reader_table_of_contents)
                .setMessage(R.string.reader_toc_unavailable)
                .setPositiveButton(R.string.reader_go_to_page) { _, _ -> showPageJumpDialog() }
                .setNegativeButton(R.string.reader_cancel, null)
                .show()
            return
        }

        val dialogBinding = DialogTableOfContentsBinding.inflate(layoutInflater)
        val tocAdapter = TocAdapter(onEntryClick = { page -> jumpToPage(page) })
        dialogBinding.tocRecycler.layoutManager = LinearLayoutManager(this)
        dialogBinding.tocRecycler.adapter = tocAdapter
        tocAdapter.submitList(entries)

        // A long outline is worse than none, so the page field filters it down as
        // the reader types instead of making them scroll to the section.
        dialogBinding.tocPageInput.doAfterTextChanged { text ->
            val query = text?.toString()?.trim().orEmpty()
            tocAdapter.submitList(
                if (query.isEmpty()) entries
                else entries.filter { it.title.contains(query, ignoreCase = true) }
            )
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
            viewModel.prefs.orientationLock != PdfPrefs.ORIENTATION_UNSET
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
                        else PdfPrefs.ORIENTATION_UNSET
                }
            }
            .setPositiveButton(R.string.reader_cancel, null)
            .show()
    }

    // ---- Night mode --------------------------------------------------------

    /**
     * Apply or remove the dark reading surface.
     *
     * pdfium inverts its own rendering when night mode is on, which is set here
     * on the view; the translucent overlay on top dims the page further and
     * keeps the paper feel of the web reader.
     */
    private fun applyNightMode(enabled: Boolean) {
        binding.pdfView.setNightMode(enabled)
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
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        // Close the inline page field before leaving the reader.
        if (binding.pageInputLayout.visibility == View.VISIBLE) {
            hidePageInput()
            return
        }
setResult(
                RESULT_OK,
                Intent().putExtra(PdfReaderContract.EXTRA_PAGE, binding.pdfView.currentPage)
            )
        super.onBackPressed()
    }

    private companion object {
        /** How the web bridge addresses a file bundled inside the APK. */
        const val ASSET_URI_PREFIX = "file:///android_asset/"

        /** Gap between pages in paged mode, so the page edge is readable. */
        const val PAGE_SPACING_DP = 8
    }
}