import { useState, useEffect } from 'react';
import { sectionsService, lessonsService, booksService } from '../../firebase/service';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../utils/helpers';

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

  const sectionLink = (section) =>
    bookById[section.id] ? `/books/${section.id}` : `/sections/${section.id}`;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse border border-gray-200">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('no_results')}</p>
      </div>
    );
  }

  return (
    <div>
      {title && <h2 className="text-2xl font-bold mb-6 text-black">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={sectionLink(section)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-black"
          >
            <h3 className="text-xl font-semibold mb-2 text-black">
              {pick(section, 'title')}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {pick(section, 'description')}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="bg-black text-white px-2 py-1 rounded text-xs">
                {t('lessons')}
              </span>
              <span className="rtl:mr-2 ltr:ml-2">{lessonCounts[section.id] || 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { SectionGrid };
