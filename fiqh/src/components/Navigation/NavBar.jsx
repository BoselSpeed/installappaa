import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Logo } from '../UI/Logo';
import { LanguageToggle } from '../UI/LanguageToggle';
import { Icon } from '../UI/Icon';

const NavBar = () => {
  const { t } = useAppSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            to="/"
            className="group flex min-h-[44px] items-center gap-2.5 text-ink"
            aria-label={t('app_name')}
          >
            <Logo className="h-7 w-7 transition-colors duration-200 group-hover:text-ink-soft" />
            <span className="text-base font-bold whitespace-nowrap sm:text-lg">{t('app_name')}</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/settings"
              aria-label={t('settings')}
              title={t('settings')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink"
            >
              <Icon name="settings" size="md" />
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export { NavBar };
