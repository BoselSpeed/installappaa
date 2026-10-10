import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { booksService } from '../services/appService';
import { resolveReadableVolumeUrl } from '../services/volumeStorage';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { BackLink } from '../components/UI/BackLink';
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
  const [searchParams] = useSearchParams();
  const [book, setBook] = useState(null);
  const [volume, setVolume] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
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
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-lg font-bold text-ink sm:text-xl lg:text-2xl">
            {volumeTitle}
          </h1>
        </div>
      </div>

      {loading ? (
        <PDFSkeleton label={t('pdf_loading')} />
      ) : pdfUrl ? (
        <Suspense fallback={<PDFSkeleton label={t('pdf_loading')} />}>
          <PDFReader
            pdfUrl={pdfUrl}
            fileName={`${bookId}-${volumeId}.pdf`}
            storageKey={`${bookId}--${volumeId}`}
            initialPage={initialPage}
          />
        </Suspense>
      ) : null}
    </PageShell>
  );
};

export { VolumeReaderPage };
