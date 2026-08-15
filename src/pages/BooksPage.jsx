import { useState, useEffect } from 'react';
import { booksService } from '../firebase/service';
import { BookCard } from '../components/UI/BookCard';
import { useTranslation } from 'react-i18next';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    const loadBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await booksService.getAllBooks();
        if (!cancelled) setBooks(data);
      } catch (err) {
        console.error('Error loading books:', err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-black">{t('books_library')}</h1>
        <p className="text-gray-600 mb-8">{t('books_library_hint')}</p>

        {books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{t('no_books')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { BooksPage };
