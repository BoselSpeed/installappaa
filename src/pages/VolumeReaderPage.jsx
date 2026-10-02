import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { booksService } from '../firebase/service';
import { getStoredVolumeBlobUrl } from '../services/volumeStorage';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { BackLink } from '../components/UI/BackLink';
import { ProgressBar } from '../components/UI/ProgressBar';
import { Card } from '../components/UI/Card';
import { Spinner } from '../components/UI/Spinner';
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
  const [book, setBook] = useState(null);
  const [volume, setVolume] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  // Whether the native reader can open this volume. Only ever true on Android
  // with a bundled PDF; locally downloaded volumes are blob: URLs, which the
  // native side cannot read, so the web reader keeps handling those.
  const [nativeSupported, setNativeSupported] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();

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

        let resolvedUrl = null;
        if (foundVolume.bundled && foundVolume.pdfUrl) {
          resolvedUrl = foundVolume.pdfUrl;
        } else {
          objectUrl = await getStoredVolumeBlobUrl(bookId, volumeId);
          if (objectUrl) {
            resolvedUrl = objectUrl;
          } else {
            // Not bundled and not on the device — the details page should
            // have prevented reaching here.
            if (!cancelled) setNotFound(true);
            return;
          }
        }

        if (!cancelled) setPdfUrl(resolvedUrl);

        if (!cancelled) {
          // Asked after the URL resolves, because a blob: URL is exactly the
          // case the native reader cannot serve.
          const verdict = await canOpenInNativeReader(resolvedUrl);
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

  const handlePdfPageChange = useCallback((page, totalPages) => {
    const value = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;
    setReadingProgress(value);
  }, []);

  /**
   * Hand the volume to the native Android reader.
   *
   * The reader stores its own progress, bookmarks, notes and highlights, so
   * this deliberately does not pass the web reader's percentage across: the two
   * readers track position independently per book.
   */
  const handleOpenNative = useCallback(async () => {
    if (!pdfUrl || !book) return;
    const opened = await openInNativeReader({
      // Stable slug: the native side keys all persisted data on this string.
      bookKey: `${bookId}--${volumeId}`,
      title: pick(volume, 'title') || pick(book, 'title') || t('volume'),
      url: pdfUrl
    });
    if (!opened) {
      // Only reachable if the plugin vanished between the probe and the tap.
      setNativeSupported(false);
    }
  }, [book, bookId, pdfUrl, t, volume, volumeId, pick]);

  if (notFound) {
    return <Navigate to={`/books/${bookId}`} replace />;
  }

  const volumeTitle = volume
    ? pick(volume, 'title') || `${t('volume')} ${volume.number || ''}`.trim()
    : '';

  return (
    <PageShell width="reading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <BackLink to={`/books/${bookId}`}>
          {pick(book, 'title') || t('books')}
        </BackLink>
        <h1 className="text-lg font-bold text-ink sm:text-xl lg:text-2xl">{volumeTitle}</h1>
      </div>

      <div className="sticky top-[7.625rem] z-30 lg:top-16 mb-6 rounded-xl border border-line bg-paper/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>{t('reading_progress')}</span>
          <span className="tabular-nums font-medium text-ink">{readingProgress}%</span>
        </div>
        <ProgressBar value={readingProgress} size="sm" label={t('reading_progress')} />

        {/* Shown only when the native reader can actually open this volume. */}
        {isNativeReaderAvailable() && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleOpenNative}
              disabled={!nativeSupported}
              className="w-full rounded-lg border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nativeSupported ? t('open_native_reader') : t('native_reader_unavailable')}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <PDFSkeleton label={t('pdf_loading')} />
      ) : (
        <Suspense fallback={<PDFSkeleton label={t('pdf_loading')} />}>
          {pdfUrl && (
            <PDFReader
              pdfUrl={pdfUrl}
              fileName={`${bookId}-${volumeId}.pdf`}
              onPageChange={handlePdfPageChange}
            />
          )}
        </Suspense>
      )}
    </PageShell>
  );
};

export { VolumeReaderPage };
