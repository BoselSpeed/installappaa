import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Logo } from '../UI/Logo';
import { LanguageToggle } from '../UI/LanguageToggle';
import { Icon } from '../UI/Icon';

const NAV_ITEMS = [
  { to: '/books', key: 'books', icon: 'books' },
  { to: '/sections', key: 'browse_sections', icon: 'grid' },
  { to: '/favorites', key: 'favorites', icon: 'bookmark' },
  { to: '/statistics', key: 'stats', icon: 'chart' },
  { to: '/achievements', key: 'achievements', icon: 'trophy' },
  { to: '/settings', key: 'settings', icon: 'settings' },
];

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

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label={t('sections')}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition-card duration-300 hover:bg-surface hover:text-ink"
              >
                <Icon name={item.icon} size="sm" />
                <span>{t(item.key)}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Mobile / tablet navigation rail */}
      <nav
        className="border-t border-line lg:hidden"
        aria-label={t('sections')}
      >
        <div className="mx-auto flex w-full max-w-7xl items-stretch gap-1 overflow-x-auto px-2 py-1.5 sm:justify-start sm:px-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-label={t(item.key)}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink"
            >
              <Icon name={item.icon} size="sm" />
              <span className="hidden min-[400px]:inline">{t(item.key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export { NavBar };
