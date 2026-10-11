import { NavLink, useLocation } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Icon } from '../UI/Icon';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { to: '/books', key: 'books', icon: 'books' },
  { to: '/sections', key: 'browse_sections', icon: 'grid' },
  { to: '/favorites', key: 'favorites', icon: 'bookmark' },
  { to: '/statistics', key: 'stats', icon: 'chart' },
  { to: '/achievements', key: 'achievements', icon: 'trophy' },
];

const BottomNav = () => {
  const { t } = useAppSettings();
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-paper/80 md:hidden"
      aria-label={t('sections')}
    >
      <div className="mx-auto flex h-14 max-w-md items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={t(item.key)}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[0.625rem] font-medium transition-colors duration-200',
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size="md" strokeWidth={isActive ? 2.25 : 1.5} />
                <span className="leading-none">{t(item.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export { BottomNav };