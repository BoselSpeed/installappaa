import { useState, useEffect } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { lessonsService } from '../firebase/service';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized } from '../utils/helpers';

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">{t('favorites')}</h1>

        {bookmarkedIds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{t('no_favorites')}</p>
            <p className="text-gray-400 mt-2">{t('add_to_favorites')}</p>
            <Link
              to="/sections"
              className="inline-block mt-6 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              {t('browse_sections')}
            </Link>
          </div>
        ) : itemsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="relative bg-white rounded-lg shadow-md border border-black hover:shadow-lg transition-shadow"
              >
                <Link to={lessonUrl(lesson)} className="block p-6">
                  <h3 className="text-xl font-semibold text-black mb-2">
                    {pick(lesson, 'title')}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-black text-white px-2 py-1 rounded text-xs">
                      {lesson.level ? t(lesson.level) : t('lessons')}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleRemove(e, lesson.id)}
                  className="absolute top-3 rtl:left-3 ltr:right-3 px-3 py-1 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
                  aria-label={t('remove_favorite')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { FavoritesPage };
