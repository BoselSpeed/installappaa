import { useEffect, useState } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../utils/achievements';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';
import { cn } from '../utils/cn';

const ACHIEVEMENT_ICONS = {
  first_lesson: 'target',
  five_lessons: 'books',
  ten_lessons: 'cap',
  first_hour: 'clock',
  five_hours: 'spark',
  streak_3: 'flame',
  streak_7: 'flame',
  streak_30: 'trophy',
  perfect_quiz: 'trophy',
  three_quizzes: 'quiz',
  high_average: 'spark',
};

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
    return <LoadingState label={t('loading')} />;
  }

  const earnedIds = progress?.achievements || [];
  const totalBadges = Object.keys(ACHIEVEMENTS).length;
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  return (
    <PageShell width="reading">
      <PageHeader
        title={t('achievements')}
        description={`${t('badges_earned')}: ${earnedCount} / ${totalBadges}`}
      />

      {earnedIds.length === 0 ? (
        <EmptyState
          icon="trophy"
          title={t('no_achievements')}
          description={t('add_to_favorites')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
            const isEarned = earnedIds.includes(key);
            return (
              <Card
                key={key}
                className={cn(
                  'flex flex-col p-5 transition-card duration-300 sm:p-6',
                  isEarned ? '' : 'border-dashed bg-surface-quiet opacity-70'
                )}
              >
                <span
                  className={cn(
                    'mb-4 flex h-11 w-11 items-center justify-center rounded-xl border',
                    isEarned
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-paper text-ink-faint'
                  )}
                >
                  <Icon name={ACHIEVEMENT_ICONS[key] || 'trophy'} size="lg" />
                </span>

                <h2 className="text-lg font-bold leading-snug text-ink">
                  {lang === 'ar' ? achievement.title_ar : achievement.title_en}
                </h2>
                <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-muted">
                  {lang === 'ar' ? achievement.description_ar : achievement.description_en}
                </p>

                <div className="mt-auto">
                  <Badge
                    variant={isEarned ? 'solid' : 'muted'}
                    icon={isEarned ? <Icon name="check" size="xs" strokeWidth={2.5} /> : <Icon name="lock" size="xs" />}
                  >
                    {isEarned ? t('achievement_unlocked') : t('achievement_locked')}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export { AchievementsPage };
