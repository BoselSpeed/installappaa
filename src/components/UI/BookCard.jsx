import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Icon } from '../UI/Icon';

const BookCard = ({ book }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();

  const author = pick(book, 'author');
  const volumeCount = book.volumes?.length || 0;
  const isLoaded = Boolean(book.volumes?.some((v) => v.bundled));

  return (
    <Card
      as={Link}
      to={`/books/${book.id}`}
      interactive
      className="group flex flex-col overflow-hidden focus-visible:border-ink"
    >
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden border-b border-line bg-surface-quiet">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={pick(book, 'title')}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
            <Icon name="book" size="xl" className="text-ink-faint" />
            <span className="text-lg font-bold leading-snug text-ink">{pick(book, 'title')}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <h3 className="text-base font-bold leading-snug text-ink sm:text-lg">
          {pick(book, 'title')}
        </h3>
        {author && <p className="text-sm text-ink-muted">{author}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-muted">
          {isLoaded && <Badge variant="solid">{t('loaded_with_app')}</Badge>}
          <Badge variant="outline">
            {volumeCount > 0
              ? t('volume_count_value', { count: volumeCount })
              : t('volume_count_none')}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export { BookCard };
