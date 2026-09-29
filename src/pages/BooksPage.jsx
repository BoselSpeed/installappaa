import { useEffect, useState } from 'react';
import { booksService } from '../firebase/service';
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

  return (
    <PageShell width="wide">
      <PageHeader title={t('books_library')} description={t('books_library_hint')} />

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
