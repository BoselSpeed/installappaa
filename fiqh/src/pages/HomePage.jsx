import { useAppSettings } from '../hooks/useAppSettings';
import { useUserProgress } from '../hooks/useUserProgress';
import { SectionGrid } from '../components/Content/SectionGrid';
import { RecentActivity } from '../components/Content/RecentActivity';
import { SearchBar } from '../components/UI/SearchBar';
import { WelcomeSection } from '../components/Content/WelcomeSection';
import { PageShell } from '../components/UI/PageShell';

const HomePage = () => {
  const { t } = useAppSettings();
  const { progress } = useUserProgress();

  return (
    <PageShell width="wide" className="space-y-8 lg:space-y-10">
      <WelcomeSection
        title={t('welcome_message')}
        description={t('welcome_hint')}
        ctaText={t('start_learning')}
        ctaUrl="/sections"
        secondaryText={t('browse_sections')}
        secondaryUrl="/sections"
      />

      <section aria-label={t('search_placeholder')}>
        <SearchBar placeholder={t('search_placeholder')} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-1">
          <RecentActivity progress={progress} />
        </div>

        <div className="lg:col-span-2">
          <SectionGrid title={t('sections')} />
        </div>
      </div>
    </PageShell>
  );
};

export { HomePage };
