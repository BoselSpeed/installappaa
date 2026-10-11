import { useEffect, useState } from 'react';
import { useLocalized } from '../../utils/helpers';
import { cn } from '../../utils/cn';
import { Icon } from '../UI/Icon';

// A book cover that never renders a broken image: if `coverImage` is missing or
// the file 404s (wrong filename in books.js, cover not uploaded yet), it falls
// back to the styled title placeholder.
const BookCover = ({ book, className = '', imageClassName = '', eager = false }) => {
  const { pick } = useLocalized();
  const src = book?.coverImage;
  const [failed, setFailed] = useState(false);

  // Reset the failure flag when the source changes so a re-render with a new
  // book (or a corrected path) gets a fresh attempt.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const title = pick(book, 'title');
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center',
          className
        )}
      >
        <Icon name="book" size="xl" className="text-ink-faint" />
        <span className="text-lg font-bold leading-snug text-ink">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', imageClassName, className)}
    />
  );
};

export { BookCover };
