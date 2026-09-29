import { useEffect, useState } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../utils/achievements';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader, SectionTitle } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ProgressBar } from '../components/UI/ProgressBar';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';

const StatCard = ({ icon, label, value }) => (
  <Card className="p-5 transition-card duration-300 hover:shadow-card-hover sm:p-6">
    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink">
      <Icon name={icon} size="md" />
    </span>
    <p className="mb-1 text-sm text-ink-muted">{label}</p>
    <p className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">{value}</p>
  </Card>
);

const StatisticsPage = () => {
  const { progress, loading } = useUserProgress();
  const { t } = useTranslation();
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
    return <LoadingState label={t('loading')} />;
  }

  const readingHours = Math.floor(stats.readingTimeMinutes / 60);
  const readingMins = stats.readingTimeMinutes % 60;
  const avgPercent = Math.round(stats.averageQuizScore * 100);
  const totalBadges = Object.keys(ACHIEVEMENTS).length;

  return (
    <PageShell width="reading">
      <PageHeader title={t('stats')} />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard
          icon="books"
          label={t('lessons_completed')}
          value={stats.completedLessons}
        />
        <StatCard
          icon="clock"
          label={t('total_reading_time')}
          value={`${readingHours > 0 ? `${readingHours}h ` : ''}${readingMins}m`}
        />
        <StatCard icon="flame" label={t('streak_days')} value={stats.streaks} />
        <StatCard icon="quiz" label={t('quizzes_taken')} value={stats.totalQuizzesTaken} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-5 text-base sm:text-lg">{t('quiz_scores')}</SectionTitle>
          {stats.totalQuizzesTaken === 0 ? (
            <p className="text-sm text-ink-muted">{t('no_quiz')}</p>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-ink-muted">{t('average_score')}</span>
                <span className="text-xl font-bold tabular-nums text-ink">
                  {avgPercent}%
                </span>
              </div>
              <ProgressBar value={avgPercent} label={t('average_score')} size="lg" />
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5 sm:p-6">
          <SectionTitle className="mb-5 text-base sm:text-lg">{t('reading_goal')}</SectionTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">
              {t('daily_goal_minutes', { count: stats.dailyGoal })}
            </span>
            <Badge variant={stats.dailyGoalCompleted ? 'solid' : 'muted'}>
              {stats.dailyGoalCompleted ? t('goal_reached') : t('in_progress')}
            </Badge>
          </div>
          <div className="mt-auto pt-6">
            <ProgressBar
              value={stats.dailyGoalCompleted ? 100 : Math.min((readingMins / stats.dailyGoal) * 100, 100)}
              label={t('reading_goal')}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-4 flex flex-col gap-5 p-5 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink bg-ink text-white">
            <Icon name="trophy" size="lg" />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">{t('achievements')}</p>
            <p className="text-sm tabular-nums text-ink-muted">
              {stats.achievements.length} / {totalBadges}
            </p>
          </div>
        </div>
        <Button to="/achievements" variant="secondary">
          {t('achievements')}
          <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
        </Button>
      </Card>
    </PageShell>
  );
};

export { StatisticsPage };
