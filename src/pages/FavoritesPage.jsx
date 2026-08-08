import { useState, useEffect } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FavoritesPage = () => {
  const { progress, loading } = useUserProgress();
  const [activeTab, setActiveTab] = useState('lessons');
  const { t } = useTranslation();

  const bookmarkedLessons = progress?.bookmarkedLessons || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">{t('favorites')}</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lessons'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('lessons')}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'lessons' && (
          <div>
            {bookmarkedLessons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('no_favorites')}</p>
                <p className="text-gray-400 mt-2">{t('add_to_favorites')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedLessons.map((lessonId) => (
                  <Link
                    key={lessonId}
                    to={`/section/lessons/${lessonId}`}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-black"
                  >
                    <h3 className="text-xl font-semibold text-black mb-2">
                      Lesson {lessonId}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="bg-black text-white px-2 py-1 rounded text-xs">
                        {t('lessons')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { FavoritesPage };
