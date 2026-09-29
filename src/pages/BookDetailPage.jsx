import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { booksService } from '../firebase/service';
import { useVolumeDownloads } from '../hooks/useVolumeDownloads';
import { VolumeCard } from '../components/Content/VolumeCard';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { SectionTitle } from '../components/UI/PageHeader';
import { BackLink } from '../components/UI/BackLink';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';

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
    return <LoadingState label={t('loading')} />;
  }

  if (error || !book) {
    return (
      <PageShell width="narrow">
        <EmptyState icon="info" title={t('error_occurred')} />
      </PageShell>
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
  const isLoaded = Boolean(volumes.some((v) => v.bundled));
  const description = pick(book, 'description');

  return (
    <PageShell width="reading">
      <BackLink to="/books" className="mb-4">
        {t('books')}
      </BackLink>

      <div className="mt-4 flex flex-col gap-6 sm:gap-8 md:flex-row md:gap-10">
        <div className="mx-auto w-40 shrink-0 sm:w-48 md:mx-0 md:w-56">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={pick(book, 'title')}
              className="w-full rounded-xl border border-line bg-paper object-cover shadow-card"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-line bg-surface">
              <Icon name="book" size="xl" className="text-ink-faint" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[1.5rem] font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
            {pick(book, 'title')}
          </h1>

          {isLoaded && (
            <Badge variant="solid" className="mt-4" icon={<Icon name="check" size="xs" strokeWidth={2.5} />}>
              {t('loaded_with_app')}
            </Badge>
          )}

          <dl className="mt-6 divide-y divide-line border-y border-line">
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="text-sm font-semibold text-ink-muted sm:w-40 sm:shrink-0">
                  {field.label}
                </dt>
                <dd className="text-sm text-ink-body">{pick(book, field.key)}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="text-sm font-semibold text-ink-muted sm:w-40 sm:shrink-0">
                {t('volume_count')}
              </dt>
              <dd className="text-sm text-ink-body">
                {volumeCount > 0
                  ? t('volume_count_value', { count: volumeCount })
                  : t('volume_count_none')}
              </dd>
            </div>
          </dl>

          {description && (
            <div className="mt-8">
              <SectionTitle className="mb-3">{t('description')}</SectionTitle>
              <p className="max-w-prose text-sm leading-relaxed text-ink-body sm:text-base">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 lg:mt-14">
        <SectionTitle className="mb-6">{t('volumes')}</SectionTitle>

        {volumeCount === 0 ? (
          <EmptyState icon="layers" title={t('no_volumes')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
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
    </PageShell>
  );
};

export { BookDetailPage };
