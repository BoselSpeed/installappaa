import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lessonsService } from '../../services/appService';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized } from '../../utils/helpers';
import { Card } from '../UI/Card';
import { SectionTitle } from '../UI/PageHeader';
import { ProgressBar } from '../UI/ProgressBar';
import { Icon } from '../UI/Icon';

const RecentActivity = ({ progress }) => {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [lastLesson, setLastLesson] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLastLesson = async () => {
      if (!progress?.lastOpened) {
        setLastLesson(null);
        return;
      }
      try {
        const lesson = await lessonsService.getLessonById(progress.lastOpened);
        if (!cancelled) setLastLesson(lesson);
      } catch (error) {
        console.error('Error loading last opened lesson:', error);
      }
    };

    loadLastLesson();
    return () => { cancelled = true; };
  }, [progress?.lastOpened]);

  const completedCount = progress?.completedLessons?.length ?? 0;
  const savedCount = progress?.bookmarkedLessons?.length ?? 0;
  const hasActivity = Boolean(progress && (progress.lastOpened || completedCount > 0 || savedCount > 0));

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle className="mb-5 flex items-center gap-2">
        <Icon name="history" size="sm" className="text-ink-faint" />
        {t('recent_activity')}
      </SectionTitle>

      {!hasActivity ? (
        <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm text-ink-muted">{t('no_recent_activity')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {lastLesson && (
            <Link
              to={lessonUrl(lastLesson)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-quiet p-4 transition-card duration-300 hover:border-ink-ghost hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {t('last_opened')}
                </p>
                <p className="truncate font-semibold text-ink">{pick(lastLesson, 'title')}</p>
              </div>
              <Icon
                name="arrowRight"
                size="md"
                className="shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          )}

          {completedCount > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{t('lessons_completed')}</span>
                <span className="font-semibold tabular-nums text-ink">{completedCount}</span>
              </div>
              <ProgressBar
                value={Math.min(completedCount * 10, 100)}
                label={t('lessons_completed')}
              />
            </div>
          )}

          {savedCount > 0 && (
            <div className="flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-muted">
              <Icon name="bookmark" size="sm" className="text-ink-faint" />
              {t('saved_lessons')}: <span className="font-semibold tabular-nums text-ink">{savedCount}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export { RecentActivity };
