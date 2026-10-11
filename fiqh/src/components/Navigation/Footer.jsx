import { Link } from 'react-router-dom';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Logo } from '../UI/Logo';
import { Icon } from '../UI/Icon';

const Footer = () => {
  const { t } = useAppSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-line bg-paper lg:mt-16">
      <div className="page-container max-w-7xl py-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-start">
          <div className="flex items-center gap-2.5 text-ink">
            <Logo className="h-6 w-6" />
            <span className="text-sm font-bold">{t('app_name')}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/settings"
              className="inline-flex min-h-[44px] items-center text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {t('privacy_policy')}
            </Link>
            <Link
              to="/settings"
              className="inline-flex min-h-[44px] items-center text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {t('terms_of_use')}
            </Link>
            <Link
              to="/books"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              <Icon name="books" size="sm" />
              {t('books')}
            </Link>
          </nav>
        </div>

        <p className="mt-6 border-t border-line pt-6 text-center text-xs text-ink-muted">
          © {year} {t('app_name')}. {t('all_rights_reserved')}
        </p>
      </div>
    </footer>
  );
};

export { Footer };
