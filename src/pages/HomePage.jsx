import { useAppSettings } from '../hooks/useAppSettings';
import { useUserProgress } from '../hooks/useUserProgress';
import { SectionGrid } from '../components/Content/SectionGrid';
import { RecentActivity } from '../components/Content/RecentActivity';
import { SearchBar } from '../components/UI/SearchBar';
import { WelcomeSection } from '../components/Content/WelcomeSection';

const HomePage = () => {
  const { t } = useAppSettings();
  const { progress } = useUserProgress();

  return (
    <div className="space-y-8">
      <WelcomeSection
        title={t('welcome_message')}
        description={t('welcome_hint')}
        ctaText={t('start_learning')}
        ctaUrl="/sections"
        secondaryText={t('browse_sections')}
        secondaryUrl="/sections"
      />

      <SearchBar placeholder={t('search_placeholder')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentActivity progress={progress} />
        </div>

        <div className="lg:col-span-2">
          <SectionGrid title={t('sections')} />
        </div>
      </div>
    </div>
  );
};

export { HomePage };
