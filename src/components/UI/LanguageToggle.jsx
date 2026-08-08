import { useAppSettings } from '../../hooks/useAppSettings';

const LanguageToggle = () => {
  const { t, updateLanguage } = useAppSettings();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
      <button
        onClick={() => updateLanguage('ar')}
        className="px-3 py-1 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
        aria-label={t('switch_to_arabic')}
      >
        العربية
      </button>
      <button
        onClick={() => updateLanguage('en')}
        className="px-3 py-1 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
        aria-label={t('switch_to_english')}
      >
        English
      </button>
    </div>
  );
};

export { LanguageToggle };
