import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';

const Footer = () => {
  const { t } = useAppSettings();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} {t('app_name')}. {t('all_rights_reserved')}
          </p>
          <div className="mt-2">
            <Link to="/settings" className="text-gray-600 hover:text-gray-900 mr-4 rtl:ml-4 rtl:mr-0">
              {t('privacy_policy')}
            </Link>
            <Link to="/settings" className="text-gray-600 hover:text-gray-900">
              {t('terms_of_use')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
