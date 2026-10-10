import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../UI/Icon';
import { Button } from '../UI/Button';
import { Spinner } from '../UI/Spinner';
import { cn } from '../../utils/cn';
import { useAppSettings } from '../../hooks/useAppSettings';
import { loadPdfDocument, extractOutline } from '../../lib/pdfOutline';
import { getBookIndex } from '../../lib/bookIndexes';
import { buildSearchIndex } from '../../lib/pdfTextSearch';
import {
  getReadingPosition,
  saveReadingPosition,
  getTocCache,
  saveTocCache,
  getControlsHintSeen,
  markControlsHintSeen,
  getBookmarks,
  toggleBookmark,
  isBookmarked,
  getNotes,
  saveNote,
  deleteNote,
  getHighlights,
  addHighlight,
  deleteHighlight
} from '../../services/readerCache';

const MAX_DPR = 2;
// A page rendered bigger than this is scaled down inside the canvas and
// stretched back with CSS. Browsers refuse or crash on enormous canvases,
// which is exactly what a high zoom on a large page produces.
const MAX_CANVAS_DIMENSION = 4096;
const MAX_CANVAS_PIXELS = 8_000_000;
// Vertical strip reserved at the bottom of every page box for its number.
const LABEL_HEIGHT = 22;

const FIT_WIDTH = 'width';
const FIT_PAGE = 'page';

// One viewport of pages above and below the visible area stays warm, so
// scrolling feels instant without painting the whole book.
const PRELOAD_MARGIN = '100% 0px 100% 0px';

const MIN_ZOOM = 50;
const MAX_ZOOM = 500;
const ZOOM_STEP = 25;
const DOUBLE_TAP_ZOOM = 250;

// Controls fade out after this long without touching the screen, and a tap
// brings them straight back — the reader keeps the page, the chrome goes.
const CONTROLS_IDLE_MS = 3500;
// Off-screen pages release their canvas this long after leaving view.
const RELEASE_MS = 1000;
const SAVE_DEBOUNCE_MS = 400;
// A double tap must land within this window to count as one.
const DOUBLE_TAP_MS = 260;
// Taps this soon after a pinch belong to the pinch, not to the tap handler.
const PINCH_GUARD_MS = 400;
// Taps further than this from the pointer-down point are drags/scrolls.
const TAP_SLOP_PX = 12;

const clampZoom = (value) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

const PDFReader = ({ pdfUrl, fileName, storageKey, initialPage, onPageChange, onControlsChange }) => {
  const { t } = useTranslation();
  const { settings, updateTheme } = useAppSettings();
  const nightMode = settings?.theme === 'dark';

  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(FIT_WIDTH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [tocEntries, setTocEntries] = useState(null);
  const [tocLoading, setTocLoading] = useState(false);
  const [tocQuery, setTocQuery] = useState('');

  // Bookmarks
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // Notes
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [notePage, setNotePage] = useState(1);

  // Highlights
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [highlights, setHighlights] = useState([]);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState([]);
  const [searchCurrentHit, setSearchCurrentHit] = useState(0);
  const [searchIndex, setSearchIndex] = useState(null);
  const [searchBuilding, setSearchBuilding] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [toast, setToast] = useState(null);

  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const pagesRef = useRef({});
  const renderedRef = useRef(new Set());
  const tasksRef = useRef({});
  const visibleRef = useRef(new Set());
  // Page boxes in scale-1 units, filled progressively while the document is
  // open. Placeholders are sized from them, so scrolling and jumping land on
  // the right offsets even before anything is painted.
  const sizesRef = useRef({});
  const sizesPromiseRef = useRef(Promise.resolve());
  const scaleRef = useRef(1);
  const currentPageRef = useRef(1);
  const numPagesRef = useRef(0);
  const fitModeRef = useRef(FIT_WIDTH);
  const zoomRef = useRef(100);
  const onPageChangeRef = useRef(onPageChange);
  const onControlsChangeRef = useRef(onControlsChange);
  const pinchStateRef = useRef(null);
  const pinchEndedAtRef = useRef(0);
  const idleTimerRef = useRef(null);
  const releaseTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const tapTimerRef = useRef(null);
  const tapStateRef = useRef(null);
  const lastTapRef = useRef(0);
  const controlsVisibleRef = useRef(true);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    onControlsChangeRef.current = onControlsChange;
  }, [onControlsChange]);

  // The page box always shows the page the reader is on.
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // ---- Controls (auto-hide chrome) ---------------------------------------

  const showControls = useCallback((autoHide = true) => {
    controlsVisibleRef.current = true;
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (autoHide) {
      idleTimerRef.current = setTimeout(() => {
        controlsVisibleRef.current = false;
        setControlsVisible(false);
      }, CONTROLS_IDLE_MS);
    }
  }, []);

  const hideControls = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    controlsVisibleRef.current = false;
    setControlsVisible(false);
  }, []);

  // A tap while the reader has scrolled away from its own top would reveal
  // controls that sit outside the viewport, so the reader is brought back
  // into view first.
  const ensureReaderInView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const navOffset = 72;
    if (rect.top < navOffset - 16 || rect.top > window.innerHeight * 0.5) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        el.scrollIntoView();
      }
    }
  }, []);

  const toggleControls = useCallback(() => {
    if (controlsVisibleRef.current) {
      hideControls();
    } else {
      ensureReaderInView();
      showControls();
    }
  }, [ensureReaderInView, hideControls, showControls]);

  const showToast = useCallback((text) => {
    setToast({ id: Date.now(), text });
  }, []);

  useEffect(() => {
    onControlsChangeRef.current?.(!controlsVisible);
  }, [controlsVisible]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---- Persistence --------------------------------------------------------

  const persistPosition = useCallback(() => {
    if (!storageKey || !numPagesRef.current) return;
    saveReadingPosition(storageKey, {
      page: currentPageRef.current,
      numPages: numPagesRef.current,
      zoom: zoomRef.current,
      fitMode: fitModeRef.current
    });
  }, [storageKey]);

  const scheduleSave = useCallback(() => {
    if (!storageKey) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistPosition, SAVE_DEBOUNCE_MS);
  }, [storageKey, persistPosition]);

  // ---- Page boxes: sizes and painting -------------------------------------

  const prefetchSizes = useCallback(async (pdf) => {
    const sizes = sizesRef.current;
    const missing = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      if (!sizes[i]) missing.push(i);
    }

    const CHUNK = 24;
    for (let i = 0; i < missing.length; i += CHUNK) {
      const slice = missing.slice(i, i + CHUNK);
      await Promise.all(
        slice.map(async (pageNumber) => {
          try {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1 });
            sizes[pageNumber] = { w: viewport.width, h: viewport.height };
          } catch {
            // Leave it unknown; the page-1 aspect ratio covers it.
          }
        })
      );
      // Yield between chunks so opening a long book never blocks the UI.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return sizes;
  }, []);

  const applySizeStyles = useCallback(() => {
    const scale = scaleRef.current;
    const sizes = sizesRef.current;
    const fallback = sizes[1];
    Object.keys(pagesRef.current).forEach((key) => {
      const el = pagesRef.current[key];
      if (!el) return;
      const size = sizes[key] || fallback;
      if (!size) return;
      el.style.width = `${Math.floor(size.w * scale)}px`;
      el.style.height = `${Math.floor(size.h * scale) + LABEL_HEIGHT}px`;
    });
  }, []);

  const computeScale = useCallback(
    (mode) => {
      const el = scrollerRef.current || containerRef.current;
      if (!el || !doc) return Promise.resolve(scaleRef.current);
      const width = el.clientWidth;
      const height = el.clientHeight || window.innerHeight;
      return doc
        .getPage(1)
        .then((page) => {
          const viewport = page.getViewport({ scale: 1 });
          let scale;
          if (mode === FIT_PAGE) {
            scale = Math.min(width / viewport.width, height / viewport.height);
          } else {
            scale = width / viewport.width;
          }
          if (zoomRef.current !== 100 && mode !== FIT_PAGE) {
            scale *= zoomRef.current / 100;
          }
          return Math.max(0.1, scale);
        })
        .catch(() => scaleRef.current);
    },
    [doc]
  );

  const cancelAllRenders = useCallback(() => {
    Object.keys(tasksRef.current).forEach((key) => {
      try {
        tasksRef.current[key].cancel();
      } catch {
        /* ignore */
      }
    });
    tasksRef.current = {};
    renderedRef.current.clear();
  }, []);

  const renderPage = useCallback(
    (pageNumber) => {
      const pageEl = pagesRef.current[pageNumber];
      if (!pageEl || !doc || renderedRef.current.has(pageNumber)) return;
      renderedRef.current.add(pageNumber);

      doc
        .getPage(pageNumber)
        .then((pdfPage) => {
          // The page may have been released while its object was loading.
          if (!renderedRef.current.has(pageNumber)) return;
          const canvas = pageEl.querySelector('canvas');
          if (!canvas) return;

          if (tasksRef.current[pageNumber]) {
            try {
              tasksRef.current[pageNumber].cancel();
            } catch {
              /* ignore */
            }
          }

          const viewport = pdfPage.getViewport({ scale: scaleRef.current });
          const cssWidth = Math.max(1, Math.floor(viewport.width));
          const cssHeight = Math.max(1, Math.floor(viewport.height));

          // Cap the backing store: crisp enough for a phone, small enough
          // that a zoomed page cannot exhaust the GPU/browser.
          let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
          const byDimension = MAX_CANVAS_DIMENSION / Math.max(cssWidth, cssHeight);
          const byArea = Math.sqrt(MAX_CANVAS_PIXELS / (cssWidth * cssHeight));
          const cap = Math.min(byDimension, byArea);
          if (cap < dpr) dpr = Math.max(cap, 0.25);

          const context = canvas.getContext('2d');
          if (!context) {
            renderedRef.current.delete(pageNumber);
            return;
          }

          canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
          canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${cssHeight}px`;

          const task = pdfPage.render({
            canvasContext: context,
            viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined
          });
          tasksRef.current[pageNumber] = task;
          task.promise.then(
            () => {
              if (tasksRef.current[pageNumber] === task) delete tasksRef.current[pageNumber];
            },
            (err) => {
              if (err && err.name === 'RenderingCancelledException') return;
              console.error('Error rendering PDF page', pageNumber, err);
              // Retry the next time the page scrolls into view.
              renderedRef.current.delete(pageNumber);
            }
          );
        })
        .catch((err) => {
          console.error('Error reading PDF page', pageNumber, err);
          renderedRef.current.delete(pageNumber);
        });
    },
    [doc]
  );

  const renderVisiblePages = useCallback(() => {
    visibleRef.current.forEach((pageNumber) => renderPage(pageNumber));
  }, [renderPage]);

  // Free the bitmaps of pages that have scrolled away. Keeping every painted
  // page alive is what made long books exhaust memory and take the app down
  // with them; a page repaints in milliseconds when it comes back.
  const releaseOffscreenPages = useCallback(() => {
    const keep = new Set();
    visibleRef.current.forEach((pageNumber) => {
      keep.add(pageNumber - 1);
      keep.add(pageNumber);
      keep.add(pageNumber + 1);
    });
    Array.from(renderedRef.current).forEach((pageNumber) => {
      if (keep.has(pageNumber)) return;
      renderedRef.current.delete(pageNumber);
      const task = tasksRef.current[pageNumber];
      if (task) {
        try {
          task.cancel();
        } catch {
          /* ignore */
        }
        delete tasksRef.current[pageNumber];
      }
      const canvas = pagesRef.current[pageNumber]?.querySelector('canvas');
      if (canvas) {
        // Style dimensions are untouched, so the box keeps its size and the
        // layout never shifts — only the pixels are returned.
        canvas.width = 1;
        canvas.height = 1;
      }
    });
  }, []);

  const scheduleRelease = useCallback(() => {
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = setTimeout(releaseOffscreenPages, RELEASE_MS);
  }, [releaseOffscreenPages]);

  // ---- Navigation ---------------------------------------------------------

  const jumpToPage = useCallback(
    async (pageNumber, options = {}) => {
      const total = numPagesRef.current;
      if (!total) return;
      const target = Math.min(Math.max(1, pageNumber), total);
      const scroller = scrollerRef.current;
      if (!scroller) return;

      // Jumping is only accurate once every box above the target has its real
      // height, so the layout is settled first (bounded by the race below so
      // a pathological document can never trap the reader).
      await Promise.race([
        sizesPromiseRef.current,
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      applySizeStyles();

      const el = pagesRef.current[target];
      if (!el) return;
      const top =
        el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      const distance = Math.abs(top - scroller.scrollTop);
      // Smooth scrolling is nice for a page or two and sluggish across a
      // whole book, so long jumps land instantly.
      const behavior =
        options.smooth && distance <= scroller.clientHeight * 1.5 ? 'smooth' : 'auto';
      scroller.scrollTo({ top, behavior });
    },
    [applySizeStyles]
  );

  const commitScale = useCallback(
    (mode, anchor) => {
      const scroller = scrollerRef.current;
      let anchorInfo = null;
      if (anchor && scroller) {
        const rect = scroller.getBoundingClientRect();
        anchorInfo = {
          // The tapped point, expressed in page units at the old scale.
          contentY: (anchor.clientY - rect.top + scroller.scrollTop) / scaleRef.current,
          offsetY: anchor.clientY - rect.top
        };
      }
      computeScale(mode).then((scale) => {
        scaleRef.current = scale;
        applySizeStyles();
        if (anchorInfo && scroller) {
          scroller.scrollTop = anchorInfo.contentY * scale - anchorInfo.offsetY;
        }
        cancelAllRenders();
        renderVisiblePages();
        scheduleSave();
      });
    },
    [applySizeStyles, cancelAllRenders, computeScale, renderVisiblePages, scheduleSave]
  );

  const applyZoomValue = useCallback(
    (nextZoom, anchor) => {
      const clamped = clampZoom(nextZoom);
      zoomRef.current = clamped;
      setZoom(clamped);
      fitModeRef.current = FIT_WIDTH;
      setFitMode(FIT_WIDTH);
      commitScale(FIT_WIDTH, anchor);
    },
    [commitScale]
  );

  const handleZoomIn = () => applyZoomValue(zoomRef.current + ZOOM_STEP);
  const handleZoomOut = () => applyZoomValue(zoomRef.current - ZOOM_STEP);

  const handleFit = (mode) => {
    zoomRef.current = 100;
    setZoom(100);
    fitModeRef.current = mode;
    setFitMode(mode);
    commitScale(mode);
  };

  const commitPageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (Number.isFinite(value)) {
      jumpToPage(value, { smooth: false });
    }
    // Snap the box back to the real page if the entry was out of range.
    setPageInput(String(currentPage));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // ---- Table of contents --------------------------------------------------

  const loadToc = useCallback(async () => {
    if (tocEntries) return;
    const curated = storageKey ? getBookIndex(storageKey) : null;
    if (curated) {
      setTocEntries(curated);
      return;
    }
    const cached = storageKey ? getTocCache(storageKey) : null;
    if (cached) {
      setTocEntries(cached);
      return;
    }
    if (!doc) return;
    setTocLoading(true);
    try {
      const entries = await extractOutline(doc);
      if (storageKey) saveTocCache(storageKey, entries);
      setTocEntries(entries);
    } catch {
      setTocEntries([]);
    } finally {
      setTocLoading(false);
    }
  }, [doc, storageKey, tocEntries]);

  const handleToggleToc = () => {
    const next = !tocOpen;
    setTocOpen(next);
    if (next) loadToc();
  };

  const filteredToc = useMemo(() => {
    if (!tocEntries) return [];
    const query = tocQuery.trim().toLowerCase();
    if (!query) return tocEntries;
    return tocEntries.filter((entry) => entry.title.toLowerCase().includes(query));
  }, [tocEntries, tocQuery]);

  const activeTocPage = useMemo(() => {
    let best = 0;
    (tocEntries || []).forEach((entry) => {
      if (entry.page <= currentPage && entry.page > best) best = entry.page;
    });
    return best;
  }, [tocEntries, currentPage]);

  const handleTocEntryClick = (page) => {
    setTocOpen(false);
    setTocQuery('');
    showControls();
    jumpToPage(page, { smooth: false });
  };

  // While the index is open the chrome must stay put, and it resumes its
  // auto-hide once the drawer closes.
  useEffect(() => {
    if (tocOpen) {
      showControls(false);
    } else if (controlsVisibleRef.current) {
      showControls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocOpen]);

  // ---- Fullscreen ---------------------------------------------------------

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ---- Bookmarks ------------------------------------------------------------

  const loadBookmarks = useCallback(() => {
    if (!storageKey) return;
    setBookmarks(getBookmarks(storageKey));
  }, [storageKey]);

  const handleToggleBookmark = useCallback(() => {
    if (!storageKey) return;
    const added = toggleBookmark(storageKey, currentPageRef.current);
    loadBookmarks();
    showToast(t(added ? 'bookmark_added' : 'bookmark_removed'));
    showControls();
  }, [storageKey, loadBookmarks, showToast, showControls, t]);

  const handleBookmarksOpen = useCallback(() => {
    loadBookmarks();
    setBookmarksOpen(true);
    showControls(false);
  }, [loadBookmarks, showControls]);

  const handleBookmarksClose = useCallback(() => {
    setBookmarksOpen(false);
    showControls();
  }, [showControls]);

  const handleBookmarkJump = useCallback((page) => {
    setBookmarksOpen(false);
    showControls();
    jumpToPage(page, { smooth: false });
  }, [jumpToPage, showControls]);

  const handleBookmarkDelete = useCallback((page) => {
    toggleBookmark(storageKey, page);
    loadBookmarks();
  }, [storageKey, loadBookmarks]);

  // ---- Notes ----------------------------------------------------------------

  const loadNotes = useCallback(() => {
    if (!storageKey) return;
    setNotes(getNotes(storageKey));
  }, [storageKey]);

  const handleNotesOpen = useCallback(() => {
    loadNotes();
    setNotePage(currentPageRef.current);
    setNoteInput('');
    setEditingNoteId(null);
    setNotesOpen(true);
    showControls(false);
  }, [loadNotes, showControls]);

  const handleNotesClose = useCallback(() => {
    setNotesOpen(false);
    setNoteInput('');
    setEditingNoteId(null);
    showControls();
  }, [showControls]);

  const handleNoteSave = useCallback(() => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    saveNote(storageKey, notePage, trimmed, editingNoteId);
    loadNotes();
    setNoteInput('');
    setEditingNoteId(null);
    showToast(t('note_saved'));
  }, [storageKey, notePage, noteInput, editingNoteId, loadNotes, showToast, t]);

  const handleNoteEdit = useCallback((note) => {
    setNoteInput(note.body);
    setEditingNoteId(note.id);
    setNotePage(note.page);
  }, []);

  const handleNoteDelete = useCallback((noteId) => {
    deleteNote(storageKey, noteId);
    loadNotes();
    showToast(t('note_deleted'));
  }, [storageKey, loadNotes, showToast, t]);

  const handleNoteJump = useCallback((page) => {
    setNotesOpen(false);
    showControls();
    jumpToPage(page, { smooth: false });
  }, [jumpToPage, showControls]);

  // ---- Highlights -----------------------------------------------------------

  const loadHighlights = useCallback(() => {
    if (!storageKey) return;
    setHighlights(getHighlights(storageKey));
  }, [storageKey]);

  const handleHighlightsOpen = useCallback(() => {
    loadHighlights();
    setHighlightsOpen(true);
    showControls(false);
  }, [loadHighlights, showControls]);

  const handleHighlightsClose = useCallback(() => {
    setHighlightsOpen(false);
    showControls();
  }, [showControls]);

  const handleHighlightCreate = useCallback(() => {
    // Get selected text or clipboard
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      addHighlight(storageKey, currentPageRef.current, selectedText);
      loadHighlights();
      showToast(t('highlight_saved'));
      selection.removeAllRanges();
    } else {
      // Fallback to clipboard
      navigator.clipboard?.readText().then((text) => {
        const clipboardText = text?.trim();
        if (clipboardText) {
          addHighlight(storageKey, currentPageRef.current, clipboardText);
          loadHighlights();
          showToast(t('highlight_saved'));
        } else {
          showToast(t('highlight_copy_first'));
        }
      }).catch(() => {
        showToast(t('highlight_copy_first'));
      });
    }
    showControls();
  }, [storageKey, loadHighlights, showToast, showControls, t]);

  const handleHighlightDelete = useCallback((highlightId) => {
    deleteHighlight(storageKey, highlightId);
    loadHighlights();
    showToast(t('highlight_deleted'));
  }, [storageKey, loadHighlights, showToast, t]);

  const handleHighlightJump = useCallback((page) => {
    setHighlightsOpen(false);
    showControls();
    jumpToPage(page, { smooth: false });
  }, [jumpToPage, showControls]);

  // ---- Search ---------------------------------------------------------------

  const runSearch = useCallback((query) => {
    if (!searchIndex) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchHits([]);
      setSearchCurrentHit(0);
      setSearchStatus(t('search_hint_empty'));
      return;
    }
    const hits = searchIndex.findPages(trimmed);
    setSearchHits(hits);
    setSearchCurrentHit(0);
    if (hits.length === 0) {
      setSearchStatus(t('search_no_results'));
    } else {
      setSearchStatus(t('search_results', { current: 1, total: hits.length, page: hits[0] }));
      jumpToPage(hits[0], { smooth: false });
    }
  }, [searchIndex, jumpToPage, t]);

  const buildSearch = useCallback(async () => {
    if (!doc || !storageKey) return;
    setSearchBuilding(true);
    setSearchStatus(t('search_indexing'));
    try {
      const index = await buildSearchIndex(pdfUrl, storageKey);
      setSearchIndex(index);
      setSearchBuilding(false);
      setSearchStatus('');
      runSearch(searchQuery);
    } catch (err) {
      console.error('Search index build failed:', err);
      setSearchBuilding(false);
      setSearchStatus(t('search_error'));
    }
  }, [doc, storageKey, pdfUrl, searchQuery, runSearch, t]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    showControls(false);
    if (!searchIndex && !searchBuilding) {
      buildSearch();
    }
  }, [searchIndex, searchBuilding, buildSearch, showControls]);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchHits([]);
    setSearchCurrentHit(0);
    showControls();
  }, [showControls]);

  const handleSearchQueryChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    runSearch(value);
  }, [runSearch]);

  const handleSearchNext = useCallback(() => {
    if (searchHits.length === 0) return;
    const next = (searchCurrentHit + 1) % searchHits.length;
    setSearchCurrentHit(next);
    const page = searchHits[next];
    jumpToPage(page, { smooth: false });
    if (searchIndex) {
      setSearchStatus(t('search_results', { current: next + 1, total: searchHits.length, page }));
    }
  }, [searchHits, searchCurrentHit, searchIndex, jumpToPage, t]);

  const handleSearchPrevious = useCallback(() => {
    if (searchHits.length === 0) return;
    const prev = (searchCurrentHit - 1 + searchHits.length) % searchHits.length;
    setSearchCurrentHit(prev);
    const page = searchHits[prev];
    jumpToPage(page, { smooth: false });
    if (searchIndex) {
      setSearchStatus(t('search_results', { current: prev + 1, total: searchHits.length, page }));
    }
  }, [searchHits, searchCurrentHit, searchIndex, jumpToPage, t]);

  // ---- Settings -------------------------------------------------------------

  const handleSettingsOpen = useCallback(() => {
    setSettingsOpen(true);
    showControls(false);
  }, [showControls]);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
    showControls();
  }, [showControls]);

  const toggleNightMode = useCallback(() => {
    const next = !nightMode;
    updateTheme(next ? 'dark' : 'light');
    showToast(t(next ? 'night_mode_on' : 'night_mode_off'));
  }, [nightMode, updateTheme, showToast, t]);

  // ---- Gestures -----------------------------------------------------------

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchEndedAtRef.current = 0;
      lastTapRef.current = 0;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStateRef.current = {
        initialDistance: Math.hypot(dx, dy),
        initialZoom: zoomRef.current
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.hypot(dx, dy);
      if (!pinchStateRef.current.initialDistance) return;
      const scale = currentDistance / pinchStateRef.current.initialDistance;
      // Zoom around the midpoint of the fingers, so the pinch feels like it
      // is stretching the page under them.
      applyZoomValue(Math.round(pinchStateRef.current.initialZoom * scale), {
        clientX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        clientY: (e.touches[0].clientY + e.touches[1].clientY) / 2
      });
    }
  };

  const handleTouchEnd = () => {
    if (pinchStateRef.current) {
      pinchStateRef.current = null;
      pinchEndedAtRef.current = Date.now();
    }
  };

  const handlePointerDown = (e) => {
    if (!e.isPrimary) {
      tapStateRef.current = null;
      return;
    }
    tapStateRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e) => {
    const state = tapStateRef.current;
    if (!state || !e.isPrimary) return;
    if (Math.abs(e.clientX - state.x) > TAP_SLOP_PX || Math.abs(e.clientY - state.y) > TAP_SLOP_PX) {
      state.moved = true;
    }
  };

  const handleDoubleTap = (e) => {
    const zoomed = zoomRef.current !== 100 || fitModeRef.current !== FIT_WIDTH;
    if (zoomed) {
      applyZoomValue(100);
    } else {
      applyZoomValue(DOUBLE_TAP_ZOOM, { clientX: e.clientX, clientY: e.clientY });
    }
    showControls();
  };

  const handleScrollerClick = (e) => {
    const state = tapStateRef.current;
    tapStateRef.current = null;
    if (!state || state.moved) return;
    if (Date.now() - pinchEndedAtRef.current < PINCH_GUARD_MS) return;
    if (e.target.closest('button, a, input, textarea, select, label')) return;

    const now = Date.now();
    const isDouble = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = 0;
    if (isDouble) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      handleDoubleTap(e);
      return;
    }
    lastTapRef.current = now;
    // One tap has to wait for its potential partner; the second wins and
    // zooms instead of flashing the controls twice.
    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      toggleControls();
    }, DOUBLE_TAP_MS);
  };

  // ---- Document lifecycle -------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDoc(null);
    setNumPages(0);
    numPagesRef.current = 0;
    setCurrentPage(1);
    setPageInput('1');
    currentPageRef.current = 1;
    sizesRef.current = {};
    pagesRef.current = {};
    sizesPromiseRef.current = Promise.resolve();
    cancelAllRenders();

    loadPdfDocument(pdfUrl, storageKey || pdfUrl)
      .then((pdf) => {
        if (cancelled) return;
        numPagesRef.current = pdf.numPages;
        setNumPages(pdf.numPages);
        setDoc(pdf);
        setLoading(false);
        sizesPromiseRef.current = prefetchSizes(pdf).catch(() => undefined);
      })
      .catch((err) => {
        console.error('Error loading PDF:', err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, storageKey, cancelAllRenders, prefetchSizes]);

  // Resume where the reader stopped: restore zoom and fit first (the layout
  // effect below reads these), then land on the saved page.
  useEffect(() => {
    if (!doc || !numPages) return undefined;
    let cancelled = false;

    const saved = storageKey ? getReadingPosition(storageKey) : null;
    if (!initialPage && saved) {
      if (saved.fitMode === FIT_WIDTH || saved.fitMode === FIT_PAGE) {
        fitModeRef.current = saved.fitMode;
        setFitMode(saved.fitMode);
      }
      if (Number.isFinite(saved.zoom)) {
        const restored = clampZoom(saved.zoom);
        zoomRef.current = restored;
        setZoom(restored);
      }
    }

    const target = Math.min(
      Math.max(initialPage || (saved && saved.page) || 1, 1),
      numPages
    );

    const run = async () => {
      await Promise.race([
        sizesPromiseRef.current,
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
      if (cancelled) return;
      applySizeStyles();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (cancelled) return;
      if (target > 1) {
        await jumpToPage(target, { smooth: false });
      }
      if (cancelled) return;
      currentPageRef.current = target;
      setCurrentPage(target);
      setPageInput(String(target));
      if (!initialPage && saved && saved.page > 1) {
        showToast(t('resumed_from_page', { page: saved.page }));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, numPages]);

  // Recompute the scale when the container changes size (rotation, resize,
  // fullscreen) and keep the current page anchored where it was, so turning
  // the phone sideways never throws the reader to a different place.
  useEffect(() => {
    if (!doc) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    let frame = 0;
    const repaint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scroller = scrollerRef.current;
        const anchorEl = pagesRef.current[currentPageRef.current];
        const prevTop =
          scroller && anchorEl
            ? anchorEl.getBoundingClientRect().top - scroller.getBoundingClientRect().top
            : null;
        computeScale(fitModeRef.current).then((scale) => {
          scaleRef.current = scale;
          applySizeStyles();
          if (scroller && anchorEl && prevTop !== null) {
            const nowTop = anchorEl.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
            const delta = nowTop - prevTop;
            if (Math.abs(delta) > 0.5) scroller.scrollTop += delta;
          }
          cancelAllRenders();
          renderVisiblePages();
        });
      });
    };

    repaint();

    const ro = new ResizeObserver(repaint);
    ro.observe(el);
    if (scrollerRef.current) ro.observe(scrollerRef.current);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [doc, applySizeStyles, computeScale, renderVisiblePages, cancelAllRenders]);

  // Track the visible pages with an observer instead of walking every page
  // on each scroll event, which forced a layout per page on long books.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!doc || !root) return undefined;

    const visible = visibleRef.current;
    visible.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        const rootTop = root.getBoundingClientRect().top;
        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.dataset.page);
          if (!pageNumber) return;
          if (entry.isIntersecting) {
            visible.add(pageNumber);
            renderPage(pageNumber);
          } else {
            visible.delete(pageNumber);
          }
        });

        let best = 0;
        let bestDistance = Infinity;
        visible.forEach((pageNumber) => {
          const el = pagesRef.current[pageNumber];
          if (!el) return;
          const distance = Math.abs(el.getBoundingClientRect().top - rootTop);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = pageNumber;
          }
        });

        if (best && best !== currentPageRef.current) {
          currentPageRef.current = best;
          setCurrentPage(best);
          onPageChangeRef.current?.(best, numPages);
          scheduleSave();
        }
        scheduleRelease();
      },
      { root, rootMargin: PRELOAD_MARGIN, threshold: 0 }
    );

    Object.keys(pagesRef.current).forEach((key) => {
      const el = pagesRef.current[key];
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      visible.clear();
    };
  }, [doc, numPages, renderPage, scheduleSave, scheduleRelease]);

  // Backgrounding the app is the moment a position has to be reliable, and
  // coming back is a natural moment to offer the controls again.
  useEffect(() => {
    const flush = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistPosition();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else showControls();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, [persistPosition, showControls]);

  // First run only: teach the tap gesture once, then never again.
  useEffect(() => {
    showControls();
    if (getControlsHintSeen()) return undefined;
    const timer = setTimeout(() => {
      showToast(t('controls_hint'));
      markControlsHintSeen();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Render -------------------------------------------------------------

  const toolbarButton =
    'inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft transition-card duration-300 hover:border-ink-ghost hover:bg-surface disabled:pointer-events-none disabled:opacity-40';
  const toolbarTextButton =
    'inline-flex min-h-[2.5rem] sm:min-h-[2.75rem] items-center justify-center rounded-xl border border-line bg-paper px-3 text-sm text-ink-soft transition-card duration-300 hover:border-ink-ghost hover:bg-surface disabled:pointer-events-none disabled:opacity-40';
  const activeButton = 'border-ink bg-ink text-[var(--color-on-accent)] hover:bg-ink-soft';
  const progressPercent = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'pdf-reader relative scroll-mt-20 overflow-hidden rounded-2xl border border-line bg-paper shadow-card',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0'
      )}
    >
      {/* Floating control bar. It hovers over the page instead of pushing it
          down, so hiding it never shifts the text under the reader's eyes. */}
      <div
        className={cn(
          'absolute inset-x-2 top-2 z-30 rounded-2xl border border-line bg-surface/95 shadow-card backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-surface/80',
          controlsVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0'
        )}
        onMouseEnter={() => {
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        }}
        onMouseLeave={() => {
          if (controlsVisibleRef.current && !tocOpen) showControls();
        }}
        role="toolbar"
        aria-label={t('reading_tools')}
      >
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3">
          <button
            onClick={() => {
              handleZoomOut();
              showControls();
            }}
            disabled={zoom <= MIN_ZOOM}
            className={toolbarButton}
            aria-label={t('zoom_out')}
            title={t('zoom_out')}
          >
            <Icon name="minus" size="md" />
          </button>
          <span className="min-w-[3rem] text-center text-sm tabular-nums text-ink">{zoom}%</span>
          <button
            onClick={() => {
              handleZoomIn();
              showControls();
            }}
            disabled={zoom >= MAX_ZOOM}
            className={toolbarButton}
            aria-label={t('zoom_in')}
            title={t('zoom_in')}
          >
            <Icon name="plus" size="md" />
          </button>

          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            onClick={() => {
              handleFit(FIT_WIDTH);
              showControls();
            }}
            className={cn(
              toolbarTextButton,
              'hidden sm:inline-flex',
              fitMode === FIT_WIDTH && zoom === 100 && activeButton
            )}
          >
            {t('fit_width')}
          </button>
          <button
            onClick={() => {
              handleFit(FIT_PAGE);
              showControls();
            }}
            className={cn(
              toolbarTextButton,
              'hidden sm:inline-flex',
              fitMode === FIT_PAGE && zoom === 100 && activeButton
            )}
          >
            {t('fit_page')}
          </button>

          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            onClick={() => {
              jumpToPage(currentPage - 1, { smooth: true });
              showControls();
            }}
            disabled={currentPage <= 1}
            className={toolbarButton}
            aria-label={t('previous_page')}
            title={t('previous_page')}
          >
            <Icon name="chevronRight" size="md" className="rtl:rotate-180" />
          </button>

          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={handleKeyDown}
              onFocus={() => showControls(false)}
              className="h-10 w-14 sm:h-11 sm:w-16 rounded-xl border border-line bg-paper px-2 text-center tabular-nums text-ink transition-card duration-300 hover:border-ink-ghost focus:border-ink"
              aria-label={t('go_to_page')}
            />
            <span className="hidden text-ink-muted sm:inline">
              {t('of_pages', { count: numPages })}
            </span>
          </div>

          <button
            onClick={() => {
              jumpToPage(currentPage + 1, { smooth: true });
              showControls();
            }}
            disabled={currentPage >= numPages}
            className={toolbarButton}
            aria-label={t('next_page')}
            title={t('next_page')}
          >
            <Icon name="chevronLeft" size="md" className="rtl:rotate-180" />
          </button>

          <div className="ms-auto flex items-center gap-1.5">
            <button
              onClick={handleToggleToc}
              className={cn(toolbarButton, tocOpen && activeButton)}
              aria-label={t('toc')}
              title={t('toc')}
            >
              <Icon name="list" size="md" />
            </button>

            <button
              onClick={handleBookmarksOpen}
              className={cn(toolbarButton, bookmarksOpen && activeButton)}
              aria-label={t('bookmarks')}
              title={t('bookmarks')}
            >
              <Icon name="bookmark" size="md" />
            </button>

            <button
              onClick={handleNotesOpen}
              className={cn(toolbarButton, notesOpen && activeButton)}
              aria-label={t('notes')}
              title={t('notes')}
            >
              <Icon name="note" size="md" />
            </button>

            <button
              onClick={handleHighlightsOpen}
              className={cn(toolbarButton, highlightsOpen && activeButton)}
              aria-label={t('highlights')}
              title={t('highlights')}
            >
              <Icon name="highlighter" size="md" />
            </button>

            <button
              onClick={handleSearchOpen}
              className={cn(toolbarButton, searchOpen && activeButton)}
              aria-label={t('search')}
              title={t('search')}
            >
              <Icon name="search" size="md" />
            </button>

            <button
              onClick={handleSettingsOpen}
              className={cn(toolbarButton, settingsOpen && activeButton)}
              aria-label={t('settings')}
              title={t('settings')}
            >
              <Icon name="settings" size="md" />
            </button>

            <button
              onClick={() => {
                toggleFullscreen();
                showControls();
              }}
              className={toolbarButton}
              aria-label={isFullscreen ? t('exit_fullscreen') : t('fullscreen')}
              title={isFullscreen ? t('exit_fullscreen') : t('fullscreen')}
            >
              <Icon name={isFullscreen ? 'close' : 'maximize'} size="md" />
            </button>

            <a
              href={pdfUrl}
              download={fileName}
              onClick={() => showControls()}
              className={cn(toolbarButton, 'hidden sm:inline-flex')}
            >
              <Icon name="download" size="sm" />
            </a>
          </div>
        </div>

        {/* Reading progress, thin enough to read at a glance. */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-2xl bg-line">
          <div
            className="h-full bg-ink transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Index drawer: headings read out of the PDF's own outline. */}
      {tocOpen && (
        <>
          <button
            type="button"
            onClick={() => setTocOpen(false)}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(20rem,88%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('toc')}</h3>
              <button
                type="button"
                onClick={() => setTocOpen(false)}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>

            {tocEntries && tocEntries.length > 0 && (
              <div className="border-b border-line px-3 py-2">
                <input
                  type="search"
                  value={tocQuery}
                  onChange={(e) => setTocQuery(e.target.value)}
                  placeholder={t('toc_filter')}
                  className="w-full rounded-xl border border-line bg-surface-quiet px-3 py-2 text-sm text-ink transition-card duration-300 focus:border-ink"
                  aria-label={t('toc_filter')}
                />
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {tocLoading && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Spinner size="md" />
                  <p className="text-center text-xs text-ink-muted">{t('toc_extracting')}</p>
                </div>
              )}

              {!tocLoading && filteredToc.length > 0 && (
                <ul className="space-y-0.5">
                  {filteredToc.map((entry, index) => {
                    const active = entry.page === activeTocPage;
                    return (
                      <li key={`${entry.page}-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleTocEntryClick(entry.page)}
                          style={{ paddingInlineStart: `${0.75 + (entry.level - 1) * 0.875}rem` }}
                          className={cn(
                            'flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                            active
                              ? 'bg-ink text-[var(--color-on-accent)]'
                              : 'text-ink-body hover:bg-surface'
                          )}
                        >
                          <span className="min-w-0 truncate">{entry.title}</span>
                          <span
                            className={cn(
                              'shrink-0 text-xs tabular-nums',
                              active ? 'opacity-80' : 'text-ink-muted'
                            )}
                          >
                            {entry.page}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!tocLoading && tocEntries && tocEntries.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {t('toc_unavailable')}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bookmarks drawer */}
      {bookmarksOpen && (
        <>
          <button
            type="button"
            onClick={handleBookmarksClose}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(20rem,88%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('bookmarks')}</h3>
              <button
                type="button"
                onClick={handleBookmarksClose}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {bookmarks.length > 0 ? (
                <ul className="space-y-0.5">
                  {bookmarks.map((bookmark, index) => (
                    <li
                      key={`${bookmark.page}-${index}`}
                      className="flex items-center gap-1 rounded-lg px-1 transition-colors hover:bg-surface"
                    >
                      <button
                        type="button"
                        onClick={() => handleBookmarkJump(bookmark.page)}
                        className="min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-start text-sm text-ink-body"
                      >
                        {t('bookmark_page', { page: bookmark.page })}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBookmarkDelete(bookmark.page)}
                        className="shrink-0 rounded-lg p-2 text-ink-muted hover:text-ink"
                        aria-label={t('delete_bookmark')}
                        title={t('delete_bookmark')}
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {t('bookmarks_empty')}
                </div>
              )}
            </div>
            <div className="border-t border-line px-4 py-2">
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={cn(toolbarTextButton, activeButton, 'w-full')}
              >
                {isBookmarked(storageKey, currentPage)
                  ? t('bookmark_remove_current', { page: currentPage })
                  : t('bookmark_add_current', { page: currentPage })}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Notes drawer */}
      {notesOpen && (
        <>
          <button
            type="button"
            onClick={handleNotesClose}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(22rem,92%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('notes')}</h3>
              <button
                type="button"
                onClick={handleNotesClose}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="border-b border-line px-4 py-3">
              <label className="block text-xs font-medium text-ink-muted mb-1">
                {t('note_on_page', { page: notePage })}
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t('note_placeholder')}
                rows={4}
                className="w-full rounded-xl border border-line bg-surface-quiet px-3 py-2 text-sm text-ink transition-card duration-300 focus:border-ink resize-none"
                aria-label={t('note_placeholder')}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2">
              <button
                type="button"
                onClick={handleNoteSave}
                className={cn(toolbarTextButton, activeButton)}
              >
                {editingNoteId ? t('note_update') : t('note_save')}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.map((note, index) => (
                    <li key={`${note.id}-${index}`} className="rounded-lg border border-line bg-surface-quiet p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-ink-muted">
                          {t('note_page_label', { page: note.page })}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleNoteEdit(note); }}
                            className="text-ink-muted hover:text-ink p-1"
                            aria-label={t('note_edit')}
                          >
                            <Icon name="edit" size="sm" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleNoteDelete(note.id); }}
                            className="text-ink-muted hover:text-ink p-1"
                            aria-label={t('note_delete')}
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-ink-body whitespace-pre-wrap">{note.body}</p>
                      <button
                        type="button"
                        onClick={() => handleNoteJump(note.page)}
                        className="mt-2 text-xs text-ink-muted hover:text-ink underline"
                      >
                        {t('go_to_page', { page: note.page })}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {t('notes_empty')}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Highlights drawer */}
      {highlightsOpen && (
        <>
          <button
            type="button"
            onClick={handleHighlightsClose}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(20rem,88%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('highlights')}</h3>
              <button
                type="button"
                onClick={handleHighlightsClose}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {highlights.length > 0 ? (
                <ul className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <li key={`${highlight.id}-${index}`} className="rounded-lg border border-line bg-surface-quiet p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-ink-muted">
                          {t('highlight_page_label', { page: highlight.page })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleHighlightDelete(highlight.id); }}
                          className="text-ink-muted hover:text-ink p-1"
                          aria-label={t('highlight_delete')}
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                      <p className="text-sm text-ink-body" style={{ backgroundColor: `#${highlight.color.toString(16).padStart(6, '0')}` }}>
                        {highlight.snippet}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleHighlightJump(highlight.page)}
                        className="mt-2 text-xs text-ink-muted hover:text-ink underline"
                      >
                        {t('go_to_page', { page: highlight.page })}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {t('highlights_empty')}
                  <p className="text-xs mt-1">{t('highlights_hint')}</p>
                </div>
              )}
            </div>
            <div className="border-t border-line px-4 py-2">
              <button
                type="button"
                onClick={handleHighlightCreate}
                className={cn(toolbarTextButton, activeButton, 'w-full')}
              >
                {t('highlight_create')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Search drawer */}
      {searchOpen && (
        <>
          <button
            type="button"
            onClick={handleSearchClose}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(20rem,88%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('search')}</h3>
              <button
                type="button"
                onClick={handleSearchClose}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="border-b border-line px-3 py-2">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                placeholder={t('search_placeholder')}
                className="w-full rounded-xl border border-line bg-surface-quiet px-3 py-2 text-sm text-ink transition-card duration-300 focus:border-ink"
                aria-label={t('search_placeholder')}
                autoFocus
              />
            </div>
            {searchBuilding && (
              <div className="flex flex-col items-center gap-3 py-6 px-4">
                <Spinner size="md" />
                <p className="text-center text-xs text-ink-muted">{searchStatus || t('search_indexing')}</p>
              </div>
            )}
            {!searchBuilding && (
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {searchHits.length > 0 ? (
                  <div>
                    <div className="px-2 py-1 text-xs text-ink-muted text-center">
                      {searchStatus}
                    </div>
                    <ul className="space-y-1">
                      {searchHits.map((page, index) => (
                        <li key={`${page}-${index}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchCurrentHit(index);
                              jumpToPage(page, { smooth: false });
                              if (searchIndex) {
                                setSearchStatus(t('search_results', { current: index + 1, total: searchHits.length, page }));
                              }
                            }}
                            className={cn(
                              'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                              index === searchCurrentHit
                                ? 'bg-ink text-[var(--color-on-accent)]'
                                : 'text-ink-body hover:bg-surface'
                            )}
                          >
                            <span className="min-w-0 truncate">
                              {searchIndex ? searchIndex.getSnippet(page, searchQuery) : t('page', { page })}
                            </span>
                            <span
                              className={cn(
                                'shrink-0 text-xs tabular-nums',
                                index === searchCurrentHit ? 'opacity-80' : 'text-ink-muted'
                              )}
                            >
                              {page}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-center gap-2 px-2 py-2">
                      <button
                        type="button"
                        onClick={handleSearchPrevious}
                        disabled={searchHits.length === 0}
                        className={toolbarButton}
                        aria-label={t('search_previous')}
                      >
                        <Icon name="chevronUp" size="md" />
                      </button>
                      <span className="text-xs text-ink-muted">
                        {searchCurrentHit + 1} / {searchHits.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleSearchNext}
                        disabled={searchHits.length === 0}
                        className={toolbarButton}
                        aria-label={t('search_next')}
                      >
                        <Icon name="chevronDown" size="md" />
                      </button>
                    </div>
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-8 text-center text-sm text-ink-muted">
                    {t('search_no_results')}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-ink-muted">
                    {t('search_hint_empty')}
                  </div>
                )
              }
              </div>
            )}
          </div>
        </>
      )}

      {/* Settings drawer */}
      {settingsOpen && (
        <>
          <button
            type="button"
            onClick={handleSettingsClose}
            className="absolute inset-0 z-30 bg-ink/30"
            aria-label={t('close')}
          />
          <div className="absolute inset-y-0 end-0 z-40 flex w-[min(20rem,88%)] flex-col border-s border-line bg-paper shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{t('settings')}</h3>
              <button
                type="button"
                onClick={handleSettingsClose}
                className={toolbarButton}
                aria-label={t('close')}
                title={t('close')}
              >
                <Icon name="close" size="md" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nightMode}
                    onChange={toggleNightMode}
                    className="h-4 w-4 rounded border-line bg-paper text-ink focus:ring-ink"
                  />
                  <span className="text-sm text-ink">{t('night_mode')}</span>
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Resume/hint notice. Separate from the chrome so it can outlive a
          control fade-out without keeping the toolbar on screen. */}
      {toast && (
        <div className="absolute bottom-14 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs text-[var(--color-on-accent)] shadow-card">
          <span className="truncate">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
            aria-label={t('close')}
          >
            <Icon name="close" size="xs" />
          </button>
        </div>
      )}

      {/* Page indicator — appears with the controls, gone while reading. */}
      <div
        className={cn(
          'absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-line bg-surface/95 px-4 py-1.5 text-xs font-medium tabular-nums text-ink shadow-card backdrop-blur transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!controlsVisible}
      >
        {currentPage} / {numPages}
      </div>

      {/* Pages */}
      <div
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleScrollerClick}
        className={`pdf-reader-scroll relative overflow-y-auto ${isFullscreen ? 'h-full' : ''}`}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Spinner size="lg" />
            <p className="text-sm text-ink-muted">{t('pdf_loading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
            <p className="text-sm text-ink-muted">{t('pdf_error')}</p>
            <Button href={pdfUrl} download={fileName} variant="secondary" size="sm">
              <Icon name="download" size="sm" />
              {t('download_pdf')}
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6 py-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div
                key={pageNumber}
                ref={(el) => {
                  if (el) pagesRef.current[pageNumber] = el;
                  else delete pagesRef.current[pageNumber];
                }}
                className="pdf-page relative mx-auto border border-line bg-paper shadow-card"
                data-page={pageNumber}
              >
                <canvas className="block" />
                <div className="absolute inset-x-0 bottom-0 text-center text-xs tabular-nums leading-[22px] text-ink-muted">
                  {pageNumber}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { PDFReader };
