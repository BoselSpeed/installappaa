import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';

const BookCard = ({ book }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();

  const author = pick(book, 'author');
  const volumeCount = book.volumes?.length || 0;

  return (
    <Link
      to={`/books/${book.id}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-black overflow-hidden flex flex-col"
    >
      <div className="aspect-[3/4] bg-white overflow-hidden border-b border-black flex items-center justify-center">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={pick(book, 'title')}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center">
            <span className="text-5xl mb-4">📖</span>
            <span className="font-semibold text-black text-lg leading-snug">
              {pick(book, 'title')}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="text-lg font-semibold text-black leading-snug">
          {pick(book, 'title')}
        </h3>
        {author && <p className="text-sm text-gray-600">{author}</p>}
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="bg-black text-white px-2 py-1 rounded">
            {t('volumes')}
          </span>
          <span className="text-gray-600">
            {volumeCount > 0
              ? t('volume_count_value', { count: volumeCount })
              : t('volume_count_none')}
          </span>
        </div>
      </div>
    </Link>
  );
};

export { BookCard };
