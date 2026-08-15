import { useSectionsService } from '../../hooks/useSectionsService';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const { sections, loading, error } = useSectionsService();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (loading) {
    return (
      <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 rtl:border-r-0 rtl:border-l">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 rtl:border-r-0 rtl:border-l">
        <div className="p-4 text-red-500 text-sm">{t('error_occurred')}</div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-gray-200 rtl:border-r-0 rtl:border-l">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-black">{t('sections')}</h2>
        <nav className="space-y-1" aria-label={t('sections')}>
          {sections
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section) => (
              <Link
                key={section.id}
                to={`/sections/${section.id}`}
                className="flex items-center px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
              >
                <span className={isRTL ? 'font-arabic' : ''}>
                  {isRTL ? section.title_ar || section.title_en : section.title_en || section.title_ar}
                </span>
              </Link>
            ))}
          {sections.length === 0 && (
            <p className="text-sm text-gray-500 px-3 py-2">{t('no_results')}</p>
          )}
        </nav>
      </div>
    </aside>
  );
};

export { Sidebar };
