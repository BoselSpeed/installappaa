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
