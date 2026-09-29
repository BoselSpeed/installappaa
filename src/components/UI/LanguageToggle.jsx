import { useAppSettings } from '../../hooks/useAppSettings';
import { cn } from '../../utils/cn';

const LANGUAGES = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

const LanguageToggle = () => {
  const { t, updateLanguage, settings } = useAppSettings();
  const current = settings?.language;

  return (
    <div
      className="flex items-center overflow-hidden rounded-xl border border-line bg-paper p-0.5"
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map(({ code, label }) => {
        const active = current === code;
        return (
          <button
            key={code}
            onClick={() => updateLanguage(code)}
            className={cn(
              'inline-flex min-h-[44px] items-center rounded-[0.625rem] px-3 text-sm font-medium transition-card duration-300',
              active
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-surface hover:text-ink'
            )}
            aria-pressed={active}
            aria-label={t(code === 'ar' ? 'switch_to_arabic' : 'switch_to_english')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export { LanguageToggle };
