import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { booksService } from '../services/appService';
import { resolveReadableVolumeUrl } from '../services/volumeStorage';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { BackLink } from '../components/UI/BackLink';
import { Card } from '../components/UI/Card';
import { Spinner } from '../components/UI/Spinner';
import { cn } from '../utils/cn';
import {
  canOpenInNativeReader,
  isNativeReaderAvailable,
  openInNativeReader
} from '../lib/nativePdfReader';

const PDFReader = lazy(() =>
  import('../components/Content/PDFReader').then((m) => ({ default: m.PDFReader }))
);

const PDFSkeleton = ({ label }) => (
  <Card className="flex flex-col items-center justify-center gap-4 py-24">
    <Spinner size="lg" />
    <p className="text-sm text-ink-muted">{label}</p>
  </Card>
);

const VolumeReaderPage = () => {
  const { bookId, volumeId } = useParams();
  const [searchParams] = useSearchParams();
  const [book, setBook] = useState(null);
  const [volume, setVolume] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  // Set when a downloaded volume has no blob: URL but does exist on disk. It is
  // then readable in-app through the Capacitor file scheme, and also by the
  // native reader.
  const [nativeUri, setNativeUri] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  // Whether the native reader can open this volume. Asked separately from the
  // in-app reader because the two accept different kinds of source.
  const [nativeSupported, setNativeSupported] = useState(false);
  // The reader fades its chrome away while a page is being read; the page
  // header follows it so nothing but the book stays on screen.
  const [controlsHidden, setControlsHidden] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  // Deep links from the table of contents arrive as ?page=N.
  const requestedPage = Number(searchParams.get('page'));
  const initialPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : undefined;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const load = async () => {
      setLoading(true);
      try {
        const data = await booksService.getBookById(bookId);
        if (!data) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const foundVolume = (data.volumes || []).find((v) => v.id === volumeId);
        if (!foundVolume) {
          if (!cancelled) setNotFound(true);
          return;
        }
        setBook(data);
        setVolume(foundVolume);

        // Bundled file, IndexedDB copy or native download — one resolver so
        // the reader page and the index preview never disagree.
        const resolved = await resolveReadableVolumeUrl(bookId, volumeId, foundVolume);
        if (!resolved) {
          if (!cancelled) setNotFound(true);
          return;
        }
        objectUrl = resolved.revoke;

        if (!cancelled) setPdfUrl(resolved.url);
        if (!cancelled) setNativeUri(resolved.nativeUri);

        if (!cancelled) {
          // The native reader is offered the file path when there is one,
          // otherwise the in-app URL: a blob: URL means nothing to the native
          // side, while a file on disk is exactly what it reads best.
          const verdict = resolved.nativeUri
            ? { supported: true }
            : await canOpenInNativeReader(resolved.url);
          if (!cancelled) setNativeSupported(Boolean(verdict?.supported));
        }
      } catch (error) {
        console.error('Error loading volume:', error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bookId, volumeId]);

  /**
   * Hand the volume to the native Android reader.
   *
   * The reader stores its own progress, bookmarks, notes and highlights, so
   * this deliberately does not pass the web reader's percentage across: the two
   * readers track position independently per book.
   */
  const handleOpenNative = useCallback(async () => {
    // A natively downloaded volume is a file on disk; the web reader's
    // blob:/asset URL is only meaningful to the WebView.
    const url = nativeUri || pdfUrl;
    if (!url || !book) return;
    const opened = await openInNativeReader({
      // Stable slug: the native side keys all persisted data on this string.
      bookKey: `${bookId}--${volumeId}`,
      title: pick(volume, 'title') || pick(book, 'title') || t('volume'),
      url
    });
    if (!opened) {
      // Only reachable if the plugin vanished between the probe and the tap.
      setNativeSupported(false);
    }
  }, [book, bookId, nativeUri, pdfUrl, t, volume, volumeId, pick]);

  if (notFound) {
    return <Navigate to={`/books/${bookId}`} replace />;
  }

  const volumeTitle = volume
    ? pick(volume, 'title') || `${t('volume')} ${volume.number || ''}`.trim()
    : '';

  return (
    <PageShell width="reading">
      <div
        className={cn(
          'mb-4 flex flex-wrap items-center justify-between gap-2 transition-opacity duration-300',
          controlsHidden && 'pointer-events-none opacity-0'
        )}
      >
        <BackLink to={`/books/${bookId}`}>
          {pick(book, 'title') || t('books')}
        </BackLink>
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-bold text-ink sm:text-xl lg:text-2xl">
            {volumeTitle}
          </h1>
          {/* Shown only when the native reader can actually open this volume. */}
          {isNativeReaderAvailable() && (
            <button
              type="button"
              onClick={handleOpenNative}
              disabled={!nativeSupported}
              className="shrink-0 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              {nativeSupported ? t('open_native_reader') : t('native_reader_unavailable')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <PDFSkeleton label={t('pdf_loading')} />
      ) : pdfUrl ? (
        <Suspense fallback={<PDFSkeleton label={t('pdf_loading')} />}>
          <PDFReader
            pdfUrl={pdfUrl}
            fileName={`${bookId}-${volumeId}.pdf`}
            // Same slug as the native reader, so both remember one position
            // per volume.
            storageKey={`${bookId}--${volumeId}`}
            initialPage={initialPage}
            onControlsChange={setControlsHidden}
          />
        </Suspense>
      ) : null}
    </PageShell>
  );
};

export { VolumeReaderPage };
