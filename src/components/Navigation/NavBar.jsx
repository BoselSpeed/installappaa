import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Logo } from '../UI/Logo';
import { LanguageToggle } from '../UI/LanguageToggle';

const NavBar = () => {
  const { t } = useAppSettings();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <Logo className="h-8 w-8 text-black" />
            <span className="text-xl font-semibold text-black whitespace-nowrap">
              {t('app_name')}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center space-x-4 rtl:space-x-reverse">
            <Link
              to="/books"
              className="px-3 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 transition-colors"
            >
              {t('books')}
            </Link>
            <Link
              to="/sections"
              className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {t('browse_sections')}
            </Link>
            <Link
              to="/favorites"
              className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {t('favorites')}
            </Link>
            <Link
              to="/settings"
              className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {t('settings')}
            </Link>
          </nav>

          <div className="flex items-center">
            <LanguageToggle />
          </div>
        </div>
      </div>

      <nav className="sm:hidden flex items-center justify-around border-t border-gray-200 px-2 py-2">
        <Link to="/books" className="px-3 py-2 text-sm font-medium text-white bg-black rounded transition-colors">
          {t('books')}
        </Link>
        <Link to="/sections" className="px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded transition-colors">
          {t('browse_sections')}
        </Link>
        <Link to="/favorites" className="px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded transition-colors">
          {t('favorites')}
        </Link>
        <Link to="/settings" className="px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded transition-colors">
          {t('settings')}
        </Link>
      </nav>
    </header>
  );
};

export { NavBar };
