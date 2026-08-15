import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { booksService } from '../firebase/service';
import { useVolumeDownloads } from '../hooks/useVolumeDownloads';
import { VolumeCard } from '../components/Content/VolumeCard';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';

const BookDetailPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const { getState, download, remove } = useVolumeDownloads(book);

  useEffect(() => {
    let cancelled = false;
    const loadBook = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await booksService.getBookById(bookId);
        if (!cancelled) setBook(data);
      } catch (err) {
        console.error('Error loading book:', err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  const fields = [
    { key: 'author', label: t('author') },
    { key: 'muhaqqiq', label: t('muhaqqiq') },
    { key: 'translator', label: t('translator') },
    { key: 'publisher', label: t('publisher') },
    { key: 'edition', label: t('edition') },
    { key: 'year', label: t('year') },
    { key: 'language', label: t('language_label') },
    { key: 'category', label: t('category') },
    { key: 'madhab', label: t('madhab') }
  ].filter((field) => {
    const value = pick(book, field.key);
    return typeof value === 'string' && value.trim() !== '';
  });

  const volumes = book.volumes || [];
  const volumeCount = volumes.length;

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/books" className="text-black hover:text-gray-600 mb-6 inline-block">
          ← {t('books')}
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-56 shrink-0 mx-auto md:mx-0">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={pick(book, 'title')}
                className="w-full rounded-lg shadow-md border border-black"
              />
            ) : (
              <div className="aspect-[3/4] rounded-lg shadow-md border border-black bg-white flex items-center justify-center">
                <span className="text-6xl">📖</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black mb-4">{pick(book, 'title')}</h1>

            <dl className="space-y-3 text-sm">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-wrap gap-2">
                  <dt className="font-medium text-black w-40 shrink-0">{field.label}:</dt>
                  <dd className="text-gray-700">{pick(book, field.key)}</dd>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <dt className="font-medium text-black w-40 shrink-0">{t('volume_count')}:</dt>
                <dd className="text-gray-700">
                  {volumeCount > 0
                    ? t('volume_count_value', { count: volumeCount })
                    : t('volume_count_none')}
                </dd>
              </div>
            </dl>

            {pick(book, 'description') && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-black mb-2">{t('description')}</h2>
                <p className="text-gray-700 leading-relaxed">{pick(book, 'description')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Volumes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-black mb-6">{t('volumes')}</h2>

          {volumeCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('no_volumes')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {volumes.map((volume) => (
                <VolumeCard
                  key={volume.id}
                  book={book}
                  volume={volume}
                  state={getState(volume)}
                  onDownload={download}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { BookDetailPage };
