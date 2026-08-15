import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lessonsService } from '../../firebase/service';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized } from '../../utils/helpers';

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

  if (!progress || (!progress.lastOpened && !(progress.completedLessons?.length))) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-black">
        <h3 className="text-xl font-semibold mb-4 text-black">{t('recent_activity')}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">{t('no_recent_activity')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-black">
      <h3 className="text-xl font-semibold mb-4 text-black">{t('recent_activity')}</h3>
      <div className="space-y-4">
        {lastLesson && (
          <Link
            to={lessonUrl(lastLesson)}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-black"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{t('last_opened')}</p>
                <p className="font-medium text-black">{pick(lastLesson, 'title')}</p>
              </div>
              <span className="text-black text-lg rtl:rotate-180">→</span>
            </div>
          </Link>
        )}

        {(progress.completedLessons?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {t('lessons_completed')}: {progress.completedLessons.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress.completedLessons.length * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {(progress.bookmarkedLessons?.length ?? 0) > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('saved_lessons')}: {progress.bookmarkedLessons.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { RecentActivity };
