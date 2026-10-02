import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { booksService } from '../services/appService';
import { BookCard } from '../components/UI/BookCard';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader } from '../components/UI/PageHeader';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Button } from '../components/UI/Button';
import { Icon } from '../components/UI/Icon';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const category = searchParams.get('category') || '';

  useEffect(() => {
    let cancelled = false;
    const loadBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await booksService.getAllBooks();
        if (cancelled) return;
        const sorted = data.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        setBooks(category ? sorted.filter((b) => b.category_ar === category) : sorted);
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
  }, [category]);

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  if (error) {
    return (
      <PageShell width="narrow">
        <EmptyState
          icon="info"
          title={t('error_occurred')}
          action={
            <Button to="/books" variant="secondary">
              {t('try_again')}
            </Button>
          }
        />
      </PageShell>
    );
  }

  const title = category ? category : t('books_library');
  const description = category
    ? t('category_book_count', { count: books.length })
    : t('books_library_hint');

  return (
    <PageShell width="wide">
      <PageHeader title={title} description={description} />

      {category && (
        <div className="mb-6">
          <Button to="/books" variant="secondary">
            <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
            {t('all_books')}
          </Button>
        </div>
      )}

      {books.length === 0 ? (
        <EmptyState
          icon="books"
          title={t('no_books')}
          action={
            <Button to="/sections" variant="secondary">
              <Icon name="grid" size="sm" />
              {t('browse_sections')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </PageShell>
  );
};

export { BooksPage };
