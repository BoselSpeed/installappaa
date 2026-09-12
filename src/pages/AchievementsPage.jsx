import { useState, useEffect } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../utils/achievements';

const AchievementsPage = () => {
  const { progress, loading } = useUserProgress();
  const { t, i18n } = useTranslation();
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (progress?.achievements) {
      setEarnedCount(progress.achievements.length);
    }
  }, [progress?.achievements]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const earnedIds = progress?.achievements || [];
  const totalBadges = Object.keys(ACHIEVEMENTS).length;
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-black">{t('achievements')}</h1>
        <p className="text-gray-600 mb-8">
          {t('badges_earned')}: {earnedCount} / {totalBadges}
        </p>

        {earnedIds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{t('no_achievements')}</p>
            <p className="text-gray-400 mt-2">{t('add_to_favorites')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
              const isEarned = earnedIds.includes(key);
              return (
                <div
                  key={key}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    isEarned
                      ? 'border-black bg-white shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="text-xl font-semibold text-black mb-1">
                    {lang === 'ar' ? achievement.title_ar : achievement.title_en}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {lang === 'ar' ? achievement.description_ar : achievement.description_en}
                  </p>
                  <span className={`inline-block mt-3 px-3 py-1 rounded text-xs font-medium ${
                    isEarned
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isEarned ? t('achievement_unlocked') : t('achievement_locked')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { AchievementsPage };
