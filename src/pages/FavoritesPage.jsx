import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '../hooks/useUserProgress';
import { lessonsService, booksService } from '../firebase/service';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader, SectionTitle } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState, Spinner } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';
import { BookCover } from '../components/Content/BookCover';

const FavoritesPage = () => {
  const { progress, loading, removeBookmark, removeBookmarkedBook } = useUserProgress();
  const [favoriteLessons, setFavoriteLessons] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  const bookmarkedIds = progress?.bookmarkedLessons || [];
  const bookmarkedBookIds = progress?.bookmarkedBooks || [];
  const bookmarkedKey = bookmarkedIds.join(',');
  const bookmarkedBooksKey = bookmarkedBookIds.join(',');

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      const lessonIds = bookmarkedKey ? bookmarkedKey.split(',') : [];
      const bookIds = bookmarkedBooksKey ? bookmarkedBooksKey.split(',') : [];
      if (lessonIds.length === 0 && bookIds.length === 0) {
        setFavoriteLessons([]);
        setFavoriteBooks([]);
        return;
      }
      setItemsLoading(true);
      try {
        const [allLessons, allBooks] = await Promise.all([
          lessonsService.getAllLessons(),
          booksService.getAllBooks()
        ]);
        if (cancelled) return;
        setFavoriteLessons(
          allLessons.filter((l) => lessonIds.includes(l.id)).sort((a, b) => a.order - b.order)
        );
        setFavoriteBooks(
          allBooks.filter((b) => bookIds.includes(b.id)).sort((a, b) => (a.order || 0) - (b.order || 0))
        );
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };

    loadFavorites();
    return () => { cancelled = true; };
  }, [bookmarkedKey, bookmarkedBooksKey]);

  const handleRemove = async (e, lessonId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeBookmark(lessonId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleRemoveBook = async (e, bookId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeBookmarkedBook(bookId);
    } catch (error) {
      console.error('Error removing book favorite:', error);
    }
  };

  const totalCount = bookmarkedIds.length + bookmarkedBookIds.length;

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  return (
    <PageShell width="wide">
      <PageHeader title={t('favorites')} />

      {totalCount === 0 ? (
        <EmptyState
          icon="bookmark"
          title={t('no_favorites')}
          description={t('add_to_favorites')}
          action={
            <Button to="/books">
              <Icon name="grid" size="sm" />
              {t('books_library')}
            </Button>
          }
        />
      ) : itemsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" label={t('loading')} />
        </div>
      ) : (
        <div className="space-y-12">
          {favoriteBooks.length > 0 && (
            <section>
              <SectionTitle className="mb-5 flex items-center gap-2">
                <Icon name="star" size="sm" className="text-ink-faint" />
                {t('favorite_books')}
              </SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {favoriteBooks.map((book) => (
                  <Card key={book.id} interactive className="group relative overflow-hidden">
                    <Link
                      to={`/books/${book.id}`}
                      className="block focus-visible:outline-none"
                    >
                      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden border-b border-line bg-surface-quiet">
                        <BookCover
                          book={book}
                          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="flex flex-col gap-2 p-5">
                        <h2 className="text-lg font-bold leading-snug text-ink">
                          {pick(book, 'title')}
                        </h2>
                        {pick(book, 'author') && (
                          <p className="text-sm text-ink-muted">{pick(book, 'author')}</p>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={(e) => handleRemoveBook(e, book.id)}
                      className="absolute end-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-paper text-ink-muted transition-card duration-300 hover:border-ink hover:bg-ink hover:text-white"
                      aria-label={t('remove_favorite')}
                      title={t('remove_favorite')}
                    >
                      <Icon name="close" size="sm" strokeWidth={2} />
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {favoriteLessons.length > 0 && (
            <section>
              <SectionTitle className="mb-5 flex items-center gap-2">
                <Icon name="bookmark" size="sm" className="text-ink-faint" />
                {t('favorite_lessons')}
              </SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {favoriteLessons.map((lesson) => (
                  <Card key={lesson.id} interactive className="relative">
                    <Link
                      to={lessonUrl(lesson)}
                      className="block p-5 focus-visible:outline-none sm:p-6"
                    >
                      <h2 className="pe-10 text-lg font-bold leading-snug text-ink">
                        {pick(lesson, 'title')}
                      </h2>
                      <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
                        <Badge variant="outline">
                          {lesson.level ? t(lesson.level) : t('lessons')}
                        </Badge>
                      </div>
                    </Link>

                    <button
                      onClick={(e) => handleRemove(e, lesson.id)}
                      className="absolute end-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-paper text-ink-muted transition-card duration-300 hover:border-ink hover:bg-ink hover:text-white"
                      aria-label={t('remove_favorite')}
                      title={t('remove_favorite')}
                    >
                      <Icon name="close" size="sm" strokeWidth={2} />
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
};

export { FavoritesPage };