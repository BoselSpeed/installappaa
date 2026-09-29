import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { lessonsService, sectionsService, lessonContentService } from '../firebase/service';
import { SearchBar } from '../components/UI/SearchBar';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized, highlight } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { SectionTitle } from '../components/UI/PageHeader';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [lessonResults, setLessonResults] = useState([]);
  const [sectionResults, setSectionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  useEffect(() => {
    if (!query) {
      setLessonResults([]);
      setSectionResults([]);
      setSearched(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const q = query.trim().toLowerCase();
        const [allLessons, allSections, allContent] = await Promise.all([
          lessonsService.getAllLessons(),
          sectionsService.getAllSections(),
          lessonsService.getAllLessons().then((lessons) =>
            Promise.all(lessons.map((l) => lessonContentService.getLessonContent(l.id)))
          )
        ]);

        const sectionById = Object.fromEntries(allSections.map((s) => [s.id, s]));

        const inText = (...values) =>
          values.some((v) => typeof v === 'string' && v.toLowerCase().includes(q));

        const matchedLessons = allLessons.filter((lesson) => {
          const content = allContent.find((c) => c.lessonId === lesson.id);
          const blockHits = (content?.blocks || []).some((b) =>
            inText(b.content_ar, b.content_en, b.type)
          );
          return inText(lesson.title_ar, lesson.title_en) || blockHits;
        });

        setLessonResults(
          matchedLessons.map((lesson) => ({
            lesson,
            section: sectionById[lesson.sectionId] || null
          }))
        );

        setSectionResults(
          allSections.filter((section) =>
            inText(section.title_ar, section.title_en, section.description_ar, section.description_en)
          )
        );
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    };

    performSearch();
  }, [query]);

  return (
    <PageShell width="reading">
      <div className="mb-8 sm:mb-10">
        <SearchBar placeholder={t('search_placeholder')} />
      </div>

      {!query ? (
        <EmptyState icon="search" title={t('search_placeholder')} />
      ) : loading ? (
        <LoadingState label={t('loading')} />
      ) : (
        <div className="space-y-10 lg:space-y-12">
          {searched && lessonResults.length === 0 && sectionResults.length === 0 && (
            <EmptyState icon="inbox" title={t('no_results')} description={t('try_another_search')} />
          )}

          {lessonResults.length > 0 && (
            <section>
              <SectionTitle className="mb-4">{t('lessons')}</SectionTitle>
              <div className="space-y-4">
                {lessonResults.map(({ lesson, section }) => (
                  <Card
                    key={lesson.id}
                    as={Link}
                    to={lessonUrl(lesson)}
                    interactive
                    className="block p-5 focus-visible:border-ink sm:p-6"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 text-lg font-bold text-ink sm:text-xl">
                        {highlight(pick(lesson, 'title'), query)}
                      </h3>
                      {section && <Badge variant="outline">{pick(section, 'title')}</Badge>}
                    </div>
                    <p className="text-sm text-ink-muted">
                      {section ? pick(section, 'description') : t('lessons')}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {sectionResults.length > 0 && (
            <section>
              <SectionTitle className="mb-4">{t('sections')}</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {sectionResults.map((section) => (
                  <Card
                    key={section.id}
                    as={Link}
                    to={`/sections/${section.id}`}
                    interactive
                    className="p-5 focus-visible:border-ink sm:p-6"
                  >
                    <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink">
                      <Icon name="book" size="md" />
                    </span>
                    <h3 className="text-lg font-bold text-ink">
                      {highlight(pick(section, 'title'), query)}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                      {highlight(pick(section, 'description'), query)}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
};

export { SearchPage };
