import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../utils/achievements';

const StatisticsPage = () => {
  const { progress, loading } = useUserProgress();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    readingTimeMinutes: 0,
    completedLessons: 0,
    bookmarkedLessons: 0,
    totalQuizzesTaken: 0,
    averageQuizScore: 0,
    streaks: 0,
    achievements: [],
    dailyGoal: 30,
    dailyGoalCompleted: false
  });

  useEffect(() => {
    if (progress) {
      setStats({
        readingTimeMinutes: progress.readingTimeMinutes || 0,
        completedLessons: progress.completedLessons?.length || 0,
        bookmarkedLessons: progress.bookmarkedLessons?.length || 0,
        totalQuizzesTaken: progress.totalQuizzesTaken || 0,
        averageQuizScore: progress.averageQuizScore || 0,
        streaks: progress.streaks || 0,
        achievements: progress.achievements || [],
        dailyGoal: progress.dailyGoal || 30,
        dailyGoalCompleted: progress.dailyGoalCompleted || false
      });
    }
  }, [progress]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const readingHours = Math.floor(stats.readingTimeMinutes / 60);
  const readingMins = stats.readingTimeMinutes % 60;
  const avgPercent = stats.averageQuizScore * 100;
  const totalBadges = Object.keys(ACHIEVEMENTS).length;

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">{t('stats')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-sm text-gray-600 mb-1">{t('lessons_completed')}</h3>
            <p className="text-3xl font-bold text-black">{stats.completedLessons}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <div className="text-3xl mb-2">⏰</div>
            <h3 className="text-sm text-gray-600 mb-1">{t('total_reading_time')}</h3>
            <p className="text-3xl font-bold text-black">
              {readingHours > 0 ? `${readingHours}h ` : ''}{readingMins}m
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <div className="text-3xl mb-2">🔥</div>
            <h3 className="text-sm text-gray-600 mb-1">{t('streak_days')}</h3>
            <p className="text-3xl font-bold text-black">{stats.streaks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="text-sm text-gray-600 mb-1">{t('quizzes_taken')}</h3>
            <p className="text-3xl font-bold text-black">{stats.totalQuizzesTaken}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('quiz_scores')}</h2>
            {stats.totalQuizzesTaken === 0 ? (
              <p className="text-gray-500">{t('no_quiz')}</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">{t('average_score')}</span>
                  <span className="text-2xl font-bold text-black">{avgPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-black h-3 rounded-full transition-all duration-500"
                    style={{ width: `${avgPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md border border-black p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('reading_goal')}</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('daily_goal_minutes', { count: stats.dailyGoal })}</span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                stats.dailyGoalCompleted
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stats.dailyGoalCompleted ? t('goal_reached') : t('in_progress')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-black p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">{t('achievements')}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏆</span>
            <span className="text-gray-600">
              {stats.achievements.length} / {totalBadges}
            </span>
          </div>
          <Link
            to="/achievements"
            className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            {t('achievements')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export { StatisticsPage };
