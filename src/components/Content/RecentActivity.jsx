import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RecentActivity = ({ progress }) => {
  const { t } = useTranslation();
  
  if (!progress || !progress.lastOpened) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-black">{t('recent_activity') || 'Recent Activity'}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">{t('no_recent_activity') || 'No recent activity'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-black">{t('recent_activity') || 'Recent Activity'}</h3>
      <div className="space-y-4">
        <Link
          to={`/section/lessons/${progress.lastOpened}`}
          className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-black"
        >
          <div className="flex items-center">
            <div className="flex-1">
              <p className="font-medium text-black">{t('last_opened') || 'Last Opened'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {progress.lastOpened && `Lesson ID: ${progress.lastOpened}`}
              </p>
            </div>
            <div className="text-left">
              <span className="text-black text-lg">→</span>
            </div>
          </div>
        </Link>
        
        {progress.completedLessons && progress.completedLessons.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {t('lessons_completed') || 'Lessons Completed'}: {progress.completedLessons.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full" 
                style={{ width: `${Math.min(progress.completedLessons.length * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { RecentActivity };
