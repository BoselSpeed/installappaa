import { useTranslation } from 'react-i18next';
import { Button } from '../components/UI/Button';
import { Icon } from '../components/UI/Icon';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <p className="text-6xl font-bold tabular-nums text-ink sm:text-7xl">404</p>
      <p className="mt-4 max-w-sm text-lg text-ink-muted">{t('not_found')}</p>
      <Button to="/" size="lg" className="mt-8">
        <Icon name="book" size="sm" />
        {t('go_home')}
      </Button>
    </div>
  );
};

export { NotFoundPage };
