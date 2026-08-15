import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">{t('not_found')}</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          {t('go_home')}
        </Link>
      </div>
    </div>
  );
};

export { NotFoundPage };
