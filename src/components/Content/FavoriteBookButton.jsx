import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserProgress } from '../../hooks/useUserProgress';
import { Icon } from '../UI/Icon';
import { cn } from '../../utils/cn';

// Star toggle that marks a whole book as a favorite. It sits inside cards that
// are themselves links, so it stops propagation to avoid navigating away.
const FavoriteBookButton = ({ bookId, className, withLabel = false }) => {
  const { t } = useTranslation();
  const { progress, addBookmarkedBook, removeBookmarkedBook } = useUserProgress();
  const [pending, setPending] = useState(false);

  const isFavorite = (progress?.bookmarkedBooks || []).includes(bookId);

  const handleToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      if (isFavorite) {
        await removeBookmarkedBook(bookId);
      } else {
        await addBookmarkedBook(bookId);
      }
    } catch (error) {
      console.error('Error toggling book favorite:', error);
    } finally {
      setPending(false);
    }
  }, [addBookmarkedBook, bookId, isFavorite, pending, removeBookmarkedBook]);

  const label = isFavorite ? t('remove_book_from_favorites') : t('add_book_to_favorites');

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm transition-card duration-300 hover:border-ink-ghost focus-visible:border-ink disabled:opacity-50',
        withLabel ? 'min-h-[44px] px-3' : 'h-9 w-9',
        isFavorite ? 'text-ink' : 'text-ink-muted hover:text-ink',
        className
      )}
    >
      <Icon name={isFavorite ? 'starFilled' : 'star'} size="sm" />
      {withLabel && <span>{isFavorite ? t('favorite_books') : t('add_to_favorites')}</span>}
    </button>
  );
};

export { FavoriteBookButton };