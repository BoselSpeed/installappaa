import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useTranslation } from 'react-i18next';
import { Icon } from '../UI/Icon';
import { Button } from '../UI/Button';
import { Spinner } from '../UI/Spinner';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_DPR = 2;
const FIT_WIDTH = 'width';
const FIT_PAGE = 'page';

// Render one viewport worth of pages above and below the visible area so
// scrolling feels instant.
const PRELOAD_MARGIN = '100% 0px 100% 0px';

const docPromises = {};

const PDFReader = ({ pdfUrl, fileName, onPageChange }) => {
  const { t } = useTranslation();
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(FIT_WIDTH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const pagesRef = useRef({});
  const renderedRef = useRef(new Set());
  const tasksRef = useRef({});
  const visibleRef = useRef(new Set());
  const scaleRef = useRef(1);
  const currentPageRef = useRef(1);
  const fitModeRef = useRef(FIT_WIDTH);
  const zoomRef = useRef(100);
  const onPageChangeRef = useRef(onPageChange);
  const pinchStateRef = useRef(null);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // The page box always shows the page the reader is on.
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    if (!docPromises[pdfUrl]) {
      docPromises[pdfUrl] = pdfjsLib.getDocument(pdfUrl).promise;
    }
    docPromises[pdfUrl]
      .then((pdf) => {
        if (cancelled) return;
        setDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
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
  }, [pdfUrl]);

  const computeScale = useCallback((mode) => {
    const el = containerRef.current;
    if (!el || !doc) return Promise.resolve(scaleRef.current);
    const width = el.clientWidth;
    const height = el.clientHeight || window.innerHeight;
    return doc.getPage(1).then((p) => {
      const viewport = p.getViewport({ scale: 1 });
      let scale;
      if (mode === FIT_PAGE) {
        scale = Math.min(width / viewport.width, height / viewport.height);
      } else {
        scale = width / viewport.width;
      }
      if (zoomRef.current !== 100 && mode !== FIT_PAGE) {
        scale = scale * (zoomRef.current / 100);
      }
      return Math.max(0.1, scale);
    });
  }, [doc]);

  const cancelAllRenders = useCallback(() => {
    Object.keys(tasksRef.current).forEach((key) => {
      try {
        tasksRef.current[key].cancel();
      } catch (e) {
        /* ignore */
      }
    });
    tasksRef.current = {};
    renderedRef.current.clear();
  }, []);

  const renderPage = useCallback((pageNumber) => {
    const page = pagesRef.current[pageNumber];
    if (!page || !doc || renderedRef.current.has(pageNumber)) return;
    renderedRef.current.add(pageNumber);
    doc.getPage(pageNumber).then((pdfPage) => {
      const viewport = pdfPage.getViewport({ scale: scaleRef.current });
      const canvas = page.querySelector('canvas');
      if (!canvas) return;
      if (tasksRef.current[pageNumber]) {
        try {
          tasksRef.current[pageNumber].cancel();
        } catch (e) {
          /* ignore */
        }
      }
      const context = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const task = pdfPage.render({
        canvasContext: context,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined
      });
      tasksRef.current[pageNumber] = task;
      task.promise.catch((err) => {
        if (err && err.name === 'RenderingCancelledException') return;
        console.error('Error rendering PDF page', pageNumber, err);
      });
    });
  }, [doc]);

  const renderVisiblePages = useCallback(() => {
    visibleRef.current.forEach((pageNumber) => renderPage(pageNumber));
  }, [renderPage]);

  // Track visible pages with an observer instead of walking every page on each
  // scroll event, which forced a layout per page on long books.
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
        }
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
  }, [doc, numPages, renderPage]);

  // Recompute the scale when the container changes size (rotation, window
  // resize, fullscreen) and repaint the pages that are on screen.
  useEffect(() => {
    if (!doc) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    let frame = 0;
    const repaint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        computeScale(fitModeRef.current).then((scale) => {
          scaleRef.current = scale;
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
  }, [doc, computeScale, renderVisiblePages, cancelAllRenders]);

  const applyZoom = (mode, customZoom) => {
    const nextMode = mode || fitModeRef.current;
    fitModeRef.current = nextMode;
    setFitMode(nextMode);
    if (customZoom) {
      zoomRef.current = customZoom;
      setZoom(customZoom);
    }
    computeScale(nextMode).then((scale) => {
      scaleRef.current = scale;
      cancelAllRenders();
      renderVisiblePages();
    });
  };

  const handleZoomIn = () => {
    const next = Math.min(zoomRef.current + 25, 300);
    zoomRef.current = next;
    setZoom(next);
    setFitMode(FIT_WIDTH);
    fitModeRef.current = FIT_WIDTH;
    applyZoom(FIT_WIDTH, next);
  };

  const handleZoomOut = () => {
    const next = Math.max(zoomRef.current - 25, 50);
    zoomRef.current = next;
    setZoom(next);
    setFitMode(FIT_WIDTH);
    fitModeRef.current = FIT_WIDTH;
    applyZoom(FIT_WIDTH, next);
  };

  const handleFit = (mode) => {
    zoomRef.current = 100;
    setZoom(100);
    applyZoom(mode, 100);
  };

  const jumpToPage = (pageNumber) => {
    const target = Math.min(Math.max(1, pageNumber), numPages);
    const pageEl = pagesRef.current[target];
    const scroller = scrollerRef.current;
    if (pageEl && scroller) {
      const delta =
        pageEl.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: delta, behavior: 'smooth' });
    }
  };

  const commitPageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (Number.isFinite(value)) {
      jumpToPage(value);
    }
    // Snap the box back to the real page if the entry was out of range.
    setPageInput(String(currentPage));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
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

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
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
      const scale = currentDistance / pinchStateRef.current.initialDistance;
      const newZoom = Math.min(Math.max(Math.round(pinchStateRef.current.initialZoom * scale), 50), 300);
      zoomRef.current = newZoom;
      setZoom(newZoom);
      setFitMode(FIT_WIDTH);
      fitModeRef.current = FIT_WIDTH;
      applyZoom(FIT_WIDTH, newZoom);
    }
  };

  const handleTouchEnd = () => {
    pinchStateRef.current = null;
  };

  const toolbarButton =
    'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-paper px-3 text-sm text-ink-soft transition-card duration-300 hover:border-ink-ghost hover:bg-surface disabled:pointer-events-none disabled:opacity-40';
  const activeButton = 'border-ink bg-ink text-white hover:bg-ink-soft';

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`overflow-hidden rounded-2xl border border-line bg-paper shadow-card ${isFullscreen ? 'fixed inset-0 z-50 flex flex-col rounded-none' : ''}`}
    >
      {/* Fullscreen shows only the reader, so the exit control sits alone in
          one corner instead of a toolbar over the pages. */}
      {isFullscreen ? (
        <button
          onClick={toggleFullscreen}
          className="absolute end-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface/90 text-ink-soft shadow-card backdrop-blur-sm transition-colors duration-300 hover:bg-surface hover:text-ink"
          aria-label={t('exit_fullscreen')}
          title={t('exit_fullscreen')}
        >
          <Icon name="close" size="md" />
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-quiet px-3 py-2.5 sm:px-4">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className={`${toolbarButton} w-11`}
            aria-label={t('zoom_out')}
            title={t('zoom_out')}
          >
            <Icon name="minus" size="md" />
          </button>
          <span className="min-w-[3rem] text-center text-sm tabular-nums text-ink">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            className={`${toolbarButton} w-11`}
            aria-label={t('zoom_in')}
            title={t('zoom_in')}
          >
            <Icon name="plus" size="md" />
          </button>

          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            onClick={() => handleFit(FIT_WIDTH)}
            className={`${toolbarButton} ${fitMode === FIT_WIDTH && zoom === 100 ? activeButton : ''}`}
          >
            {t('fit_width')}
          </button>
          <button
            onClick={() => handleFit(FIT_PAGE)}
            className={`${toolbarButton} ${fitMode === FIT_PAGE && zoom === 100 ? activeButton : ''}`}
          >
            {t('fit_page')}
          </button>

          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <button
            onClick={() => jumpToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${toolbarButton} w-11`}
            aria-label={t('previous_page')}
            title={t('previous_page')}
          >
            <Icon name="chevronRight" size="md" className="rtl:rotate-180" />
          </button>

          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={handleKeyDown}
              className="h-11 w-16 rounded-xl border border-line bg-paper px-2 text-center tabular-nums text-ink transition-card duration-300 hover:border-ink-ghost focus:border-ink"
              aria-label={t('go_to_page')}
            />
            <span className="hidden text-ink-muted sm:inline">
              {t('of_pages', { count: numPages })}
            </span>
          </div>

          <button
            onClick={() => jumpToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className={`${toolbarButton} w-11`}
            aria-label={t('next_page')}
            title={t('next_page')}
          >
            <Icon name="chevronLeft" size="md" className="rtl:rotate-180" />
          </button>

          <div className="ms-auto flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className={`${toolbarButton} w-11`}
              aria-label={t('fullscreen')}
              title={t('fullscreen')}
            >
              <Icon name="maximize" size="md" />
            </button>

            <a href={pdfUrl} download={fileName} className={`${toolbarButton} gap-1.5`}>
              <Icon name="download" size="sm" />
              <span className="hidden sm:inline">{t('download_pdf')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Pages */}
      <div
        ref={scrollerRef}
        className={`pdf-reader-scroll overflow-y-auto ${isFullscreen ? 'min-h-0 flex-1' : ''}`}
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
          <div className="space-y-6 py-6">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div
                key={pageNumber}
                ref={(el) => { pagesRef.current[pageNumber] = el; }}
                className="pdf-page mx-auto border border-line bg-paper shadow-card"
                style={{ width: 'fit-content' }}
                data-page={pageNumber}
              >
                <canvas></canvas>
                <div className="py-1 text-center text-xs tabular-nums text-ink-muted">
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