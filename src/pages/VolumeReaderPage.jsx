import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { booksService } from '../firebase/service';
import { getStoredVolumeBlobUrl } from '../services/volumeStorage';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';

const PDFReader = lazy(() =>
  import('../components/Content/PDFReader').then((m) => ({ default: m.PDFReader }))
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
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link to={`/books/${bookId}`} className="text-black hover:text-gray-600">
            ← {pick(book, 'title') || t('books')}
          </Link>
          <h1 className="text-2xl font-bold text-black">{volumeTitle}</h1>
        </div>

        <div className="sticky top-16 z-30 mb-6 bg-white">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>{t('reading_progress')}</span>
            <span>{readingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="text-gray-500">{t('pdf_loading')}</p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 gap-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                <p className="text-gray-500">{t('pdf_loading')}</p>
              </div>
            }
          >
            {pdfUrl && (
              <PDFReader
                pdfUrl={pdfUrl}
                fileName={`${bookId}-${volumeId}.pdf`}
                onPageChange={handlePdfPageChange}
              />
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
};

export { VolumeReaderPage };
