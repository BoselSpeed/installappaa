import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useTranslation } from 'react-i18next';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_DPR = 2;
const FIT_WIDTH = 'width';
const FIT_PAGE = 'page';

// Cache loaded documents per URL so React StrictMode's double-invoked effects
// reuse the same loading task instead of destroying the shared worker.
const docPromises = {};

const PDFReader = ({ pdfUrl, fileName, onPageChange }) => {
  const { t } = useTranslation();
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(FIT_WIDTH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const pagesRef = useRef({});
  const renderedRef = useRef(new Set());
  const tasksRef = useRef({});
  const scaleRef = useRef(1);
  const currentPageRef = useRef(1);
  const fitModeRef = useRef(FIT_WIDTH);
  const zoomRef = useRef(100);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

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
    if (!el || !doc) return scaleRef.current;
    const width = el.clientWidth;
    const height = el.clientHeight || window.innerHeight;
    const page = doc.getPage(1);
    return page.then((p) => {
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
    if (!doc) return;
    const el = containerRef.current;
    if (!el) return;
    const containerTop = el.getBoundingClientRect().top;
    const containerHeight = el.clientHeight;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = pagesRef.current[i];
      if (!page) continue;
      const rect = page.getBoundingClientRect();
      if (rect.bottom >= containerTop - containerHeight && rect.top <= containerTop + containerHeight * 2) {
        renderPage(i);
      }
    }
  }, [doc, renderPage]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const containerTop = el.getBoundingClientRect().top;
    let active = 1;
    let best = Infinity;
    for (let i = 1; i <= numPages; i++) {
      const page = pagesRef.current[i];
      if (!page) continue;
      const rect = page.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerTop);
      if (distance < best) {
        best = distance;
        active = i;
      }
    }
    if (active !== currentPageRef.current) {
      currentPageRef.current = active;
      setCurrentPage(active);
      onPageChangeRef.current?.(active, numPages);
    }
    renderVisiblePages();
  }, [numPages, renderVisiblePages]);

  useEffect(() => {
    if (!doc) return;
    computeScale(fitModeRef.current).then((scale) => {
      scaleRef.current = scale;
      cancelAllRenders();
      renderVisiblePages();
    });
  }, [doc, computeScale, renderVisiblePages, cancelAllRenders]);

  useEffect(() => {
    if (!doc) return;
    const ro = new ResizeObserver(() => {
      if (!fitModeRef.current) return;
      computeScale(fitModeRef.current).then((scale) => {
        scaleRef.current = scale;
        cancelAllRenders();
        renderVisiblePages();
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [doc, computeScale, renderVisiblePages, cancelAllRenders]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

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
    if (pageEl && containerRef.current) {
      const top = pageEl.offsetTop - containerRef.current.offsetTop;
      containerRef.current.scrollTo({ top, behavior: 'smooth' });
      renderVisiblePages();
    }
  };

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (Number.isFinite(value)) jumpToPage(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(e.target.value, 10);
      if (Number.isFinite(value)) jumpToPage(value);
    }
  };

  const toolbarButton = 'px-3 py-1.5 border border-black rounded text-sm text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  const activeButton = 'bg-black text-white';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className={toolbarButton}
          aria-label={t('zoom_out')}
          title={t('zoom_out')}
        >
          −
        </button>
        <span className="text-sm text-black tabular-nums min-w-[2.5rem] text-center">{zoom}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 300}
          className={toolbarButton}
          aria-label={t('zoom_in')}
          title={t('zoom_in')}
        >
          +
        </button>

        <span className="w-px h-6 bg-gray-300 mx-1"></span>

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

        <span className="w-px h-6 bg-gray-300 mx-1"></span>

        <button
          onClick={() => jumpToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={toolbarButton}
          aria-label={t('previous_page')}
          title={t('previous_page')}
        >
          {t('previous')}
        </button>

        <div className="flex items-center gap-1 text-sm text-black">
          <input
            type="number"
            min="1"
            max={numPages}
            defaultValue={1}
            key={currentPage}
            onBlur={handlePageInput}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 border border-black rounded text-center tabular-nums"
            aria-label={t('go_to_page')}
          />
          <span className="text-gray-500">
            {t('of_pages', { count: numPages })}
          </span>
        </div>

        <button
          onClick={() => jumpToPage(currentPage + 1)}
          disabled={currentPage >= numPages}
          className={toolbarButton}
          aria-label={t('next_page')}
          title={t('next_page')}
        >
          {t('next')}
        </button>

        <a
          href={pdfUrl}
          download={fileName}
          className={`${toolbarButton} rtl:mr-auto ltr:ml-auto`}
        >
          {t('download_pdf')}
        </a>
      </div>

      {/* Pages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="pdf-reader-scroll overflow-y-auto"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="text-gray-500">{t('pdf_loading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-gray-500">{t('pdf_error')}</p>
            <a
              href={pdfUrl}
              download={fileName}
              className="px-4 py-2 border border-black rounded text-sm text-black hover:bg-gray-50 transition-colors"
            >
              {t('download_pdf')}
            </a>
          </div>
        )}

        {!loading && !error && (
          <div className="py-6 space-y-6">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div
                key={pageNumber}
                ref={(el) => { pagesRef.current[pageNumber] = el; }}
                className="pdf-page mx-auto shadow-sm border border-gray-200 bg-white"
                style={{ width: 'fit-content' }}
                data-page={pageNumber}
              >
                <canvas></canvas>
                <div className="text-center text-xs text-gray-400 py-1">
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
