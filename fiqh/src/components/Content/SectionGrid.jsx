import { useEffect, useState } from 'react';
import { sectionsService, lessonsService, booksService } from '../../services/appService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { SectionTitle } from '../UI/PageHeader';
import { Icon } from '../UI/Icon';
import { EmptyState } from '../UI/EmptyState';

const SectionGrid = ({ title }) => {
  const [sections, setSections] = useState([]);
  const [books, setBooks] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { pick } = useLocalized();

  useEffect(() => {
    const loadSections = async () => {
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
        setSections(data.slice().sort((a, b) => (a.order || 0) - (b.order || 0)));
        setLessonCounts(counts);
        setBooks(allBooks);
      } catch (error) {
        console.error('Error loading sections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);

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
    return (
      <div>
        {title && <SectionTitle className="mb-6">{title}</SectionTitle>}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
              <div className="mb-4 h-6 w-2/3 animate-pulse rounded-lg bg-surface" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-surface" />
              <div className="mb-5 h-4 w-3/4 animate-pulse rounded bg-surface" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-surface" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return <EmptyState icon="grid" title={t('no_results')} />;
  }

  return (
    <div>
      {title && <SectionTitle className="mb-6">{title}</SectionTitle>}
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

              <h3 className="text-lg font-bold leading-snug text-ink sm:text-xl">
                {pick(section, 'title')}
              </h3>

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
    </div>
  );
};

export { SectionGrid };
