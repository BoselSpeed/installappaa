import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { BookCover } from '../Content/BookCover';
import { FavoriteBookButton } from '../Content/FavoriteBookButton';

const BookCard = ({ book }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();

  const author = pick(book, 'author');
  const volumeCount = book.volumes?.length || 0;
  const isLoaded = Boolean(book.volumes?.some((v) => v.bundled));

  return (
    <div className="relative">
      <FavoriteBookButton
        bookId={book.id}
        className="absolute end-2 top-2 z-10 border-line bg-surface/90 shadow-card backdrop-blur-sm"
      />
      <Card
        as={Link}
        to={`/books/${book.id}`}
        interactive
        className="group flex flex-col overflow-hidden focus-visible:border-ink"
      >
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden border-b border-line bg-surface-quiet">
          <BookCover
            book={book}
            imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
          />
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
    </div>
  );
};

export { BookCard };
