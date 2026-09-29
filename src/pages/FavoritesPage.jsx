import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '../hooks/useUserProgress';
import { lessonsService } from '../firebase/service';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState, Spinner } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';

const FavoritesPage = () => {
  const { progress, loading, removeBookmark } = useUserProgress();
  const [favoriteLessons, setFavoriteLessons] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  const bookmarkedIds = progress?.bookmarkedLessons || [];
  const bookmarkedKey = bookmarkedIds.join(',');

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      const ids = bookmarkedKey ? bookmarkedKey.split(',') : [];
      if (ids.length === 0) {
        setFavoriteLessons([]);
        return;
      }
      setItemsLoading(true);
      try {
        const allLessons = await lessonsService.getAllLessons();
        if (cancelled) return;
        setFavoriteLessons(
          allLessons
            .filter((l) => ids.includes(l.id))
            .sort((a, b) => a.order - b.order)
        );
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };

    loadFavorites();
    return () => { cancelled = true; };
  }, [bookmarkedKey]);

  const handleRemove = async (e, lessonId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeBookmark(lessonId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  return (
    <PageShell width="wide">
      <PageHeader title={t('favorites')} />

      {bookmarkedIds.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title={t('no_favorites')}
          description={t('add_to_favorites')}
          action={
            <Button to="/sections">
              <Icon name="grid" size="sm" />
              {t('browse_sections')}
            </Button>
          }
        />
      ) : itemsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" label={t('loading')} />
        </div>
      ) : (
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
      )}
    </PageShell>
  );
};

export { FavoritesPage };
