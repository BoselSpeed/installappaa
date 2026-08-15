import { useAppSettings } from '../../hooks/useAppSettings';

const LanguageToggle = () => {
  const { t, updateLanguage, settings } = useAppSettings();
  const current = settings?.language;

  return (
    <div className="flex items-center border border-black rounded overflow-hidden" role="group" aria-label="Language">
      <button
        onClick={() => updateLanguage('ar')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          current === 'ar' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
        }`}
        aria-pressed={current === 'ar'}
        aria-label={t('switch_to_arabic')}
      >
        العربية
      </button>
      <button
        onClick={() => updateLanguage('en')}
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          current === 'en' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
        }`}
        aria-pressed={current === 'en'}
        aria-label={t('switch_to_english')}
      >
        English
      </button>
    </div>
  );
};

export { LanguageToggle };
