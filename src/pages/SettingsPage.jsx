import { useState } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader, SectionTitle } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';
import { cn } from '../utils/cn';
import pkg from '../../package.json';

const LANGUAGES = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

const FONT_SIZES = [
  { value: 'small', className: 'text-sm' },
  { value: 'medium', className: 'text-base' },
  { value: 'large', className: 'text-lg' },
];

const SettingsPage = () => {
  const { settings, updateLanguage, updateFontSize, loading } = useAppSettings();
  const { t } = useTranslation();
  const [status, setStatus] = useState('');

  const handleClearCache = () => {
    try {
      localStorage.clear();
      setStatus(t('cache_cleared'));
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  const previewClass =
    FONT_SIZES.find((s) => s.value === settings?.fontSize)?.className || 'text-base';

  return (
    <PageShell width="narrow">
      <PageHeader title={t('settings')} />

      {status && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2 rounded-xl border border-ink bg-surface px-4 py-3 text-sm text-ink"
        >
          <Icon name="checkCircle" size="sm" />
          {status}
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Icon name="language" size="sm" className="text-ink-faint" />
            {t('language')}
          </SectionTitle>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map(({ code, label }) => {
              const active = settings?.language === code;
              return (
                <Button
                  key={code}
                  size="md"
                  variant={active ? 'primary' : 'secondary'}
                  onClick={() => updateLanguage(code)}
                  aria-pressed={active}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Icon name="list" size="sm" className="text-ink-faint" />
            {t('display')}
          </SectionTitle>
          <p className="mb-3 text-sm text-ink-muted">{t('font_size')}</p>
          <div className="flex flex-wrap gap-3">
            {FONT_SIZES.map(({ value, className }) => {
              const active = settings?.fontSize === value;
              return (
                <Button
                  key={value}
                  size="md"
                  variant={active ? 'primary' : 'secondary'}
                  onClick={() => updateFontSize(value)}
                  aria-pressed={active}
                >
                  <span className={className}>{t(value)}</span>
                </Button>
              );
            })}
          </div>
          <p
            className={cn(
              'mt-5 border-t border-line pt-5 leading-relaxed text-ink-body',
              previewClass
            )}
          >
            {t('font_preview')}
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Icon name="layers" size="sm" className="text-ink-faint" />
            {t('data')}
          </SectionTitle>
          <Button variant="secondary" size="sm" onClick={handleClearCache}>
            <Icon name="trash" size="sm" />
            {t('clear_cache')}
          </Button>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Icon name="book" size="sm" className="text-ink-faint" />
            {t('about')}
          </SectionTitle>
          <div className="space-y-2 text-sm text-ink-muted">
            <p className="font-semibold text-ink">{t('app_name')}</p>
            <p>
              {t('version')}: {pkg.version}
            </p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle className="mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Icon name="file" size="sm" className="text-ink-faint" />
            {t('legal')}
          </SectionTitle>
          <div className="space-y-1">
            <a
              href="#"
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink"
            >
              <Icon name="arrowUpRight" size="sm" />
              {t('privacy_policy')}
            </a>
            <a
              href="#"
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink"
            >
              <Icon name="arrowUpRight" size="sm" />
              {t('terms_of_use')}
            </a>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};

export { SettingsPage };
