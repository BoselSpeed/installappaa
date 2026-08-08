import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Logo } from '../UI/Logo';

const NavBar = () => {
  const { t } = useAppSettings();

  return (
    <header className="bg-white border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <Logo className="h-8 w-8" />
              <span className="self-center text-xl font-semibold text-black whitespace-nowrap">
                {t('app_name')}
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/sections" className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors">
              {t('browse_sections')}
            </Link>
            <Link to="/favorites" className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors">
              {t('favorites')}
            </Link>
            <Link to="/settings" className="px-3 py-2 text-sm font-medium text-black bg-white border border-black rounded hover:bg-gray-50 transition-colors">
              {t('settings')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export { NavBar };
