import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sectionsService, lessonsService, booksService } from '../firebase/service';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';
import { PageShell } from '../components/UI/PageShell';
import { PageHeader } from '../components/UI/PageHeader';
import { BackLink } from '../components/UI/BackLink';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { EmptyState } from '../components/UI/EmptyState';
import { LoadingState } from '../components/UI/Spinner';
import { Icon } from '../components/UI/Icon';

const SectionsPage = () => {
  const { sectionId } = useParams();
  const [sections, setSections] = useState([]);
  const [books, setBooks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, allLessons, allBooks] = await Promise.all([
          sectionsService.getAllSections(),
          lessonsService.getAllLessons(),
          booksService.getAllBooks()
        ]);

        const counts = {};
        allLessons.forEach((l) => {
          counts[l.sectionId] = (counts[l.sectionId] || 0) + 1;
        });
        setLessonCounts(counts);
        setBooks(allBooks);

        const sorted = data.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        setSections(sorted);

        if (sectionId) {
          const section = sorted.find((s) => s.id === sectionId);
          setSelectedSection(section || null);
          if (section) {
            const sectionLessons = await lessonsService.getLessonsBySection(sectionId);
            setLessons(sectionLessons);
          }
        }
      } catch (err) {
        console.error('Error loading sections:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [sectionId]);

  const bookById = {};
  books.forEach((book) => {
    bookById[book.id] = book;
  });

  // A section is either a single book, a category of books, or a set of
  // lessons. Categories link to the library filtered by that category.
  const categoryLabel = (section) => {
    const match = books.find((book) => book.category_ar === section.title_ar);
    return match ? match.category_ar : '';
  };

  const sectionLink = (section) => {
    if (bookById[section.id]) return `/books/${section.id}`;
    const cat = categoryLabel(section);
    if (cat) return `/books?category=${encodeURIComponent(cat)}`;
    return `/sections/${section.id}`;
  };

  const countBadge = (section) => {
    if (bookById[section.id]) {
      return {
        label: t('volumes_short'),
        count: (bookById[section.id].volumes || []).length
      };
    }
    const cat = categoryLabel(section);
    if (cat) {
      return {
        label: t('books'),
        count: books.filter((book) => book.category_ar === cat).length
      };
    }
    return { label: t('lessons'), count: lessonCounts[section.id] || 0 };
  };

  if (loading) {
    return <LoadingState label={t('loading')} />;
  }

  if (error) {
    return (
      <PageShell width="narrow">
        <EmptyState icon="info" title={t('error_occurred')} />
      </PageShell>
    );
  }

  return (
    <PageShell width="wide">
      {!selectedSection ? (
        <>
          <PageHeader title={t('sections')} />

          {sections.length === 0 ? (
            <EmptyState icon="grid" title={t('no_results')} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => {
                const badge = countBadge(section);
                return (
                  <Card
                    key={section.id}
                    as={Link}
                    to={sectionLink(section)}
                    interactive
                    className="group flex flex-col p-5 focus-visible:border-ink sm:p-6"
                  >
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors duration-300 group-hover:border-ink-ghost group-hover:bg-paper">
                      <Icon name="book" size="md" />
                    </span>

                    <h2 className="text-lg font-bold leading-snug text-ink sm:text-xl">
                      {pick(section, 'title')}
                    </h2>

                    <p className="mt-2 mb-5 line-clamp-2 text-sm text-ink-muted">
                      {pick(section, 'description')}
                    </p>

                    <div className="mt-auto flex items-center gap-2 text-sm text-ink-muted">
                      <Badge variant="solid">{badge.label}</Badge>
                      <span className="tabular-nums">{badge.count}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <BackLink to="/sections" className="mb-4">
            {t('previous')} · {t('sections')}
          </BackLink>

          <header className="mb-6 mt-4 sm:mb-8">
            <h1 className="text-[1.5rem] font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
              {pick(selectedSection, 'title')}
            </h1>
            {pick(selectedSection, 'description') && (
              <p className="mt-3 max-w-prose text-sm text-ink-muted sm:text-base">
                {pick(selectedSection, 'description')}
              </p>
            )}
          </header>

          {lessons.length === 0 ? (
            <EmptyState icon="list" title={t('no_results')} />
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  as={Link}
                  to={`/section/${sectionId}/lesson/${lesson.id}`}
                  interactive
                  className="group flex items-center justify-between gap-4 p-5 focus-visible:border-ink sm:p-6"
                >
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-snug text-ink sm:text-xl">
                      {pick(lesson, 'title')}
                    </h2>
                    <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                      <Badge variant="outline">
                        {lesson.level ? t(lesson.level) : t('beginner')}
                      </Badge>
                    </div>
                  </div>
                  <Icon
                    name="arrowRight"
                    size="md"
                    className="shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180"
                  />
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
};

export { SectionsPage };
