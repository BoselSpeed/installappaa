import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sectionsService, lessonsService, booksService } from '../firebase/service';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';

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

  const sectionLink = (section) =>
    bookById[section.id] ? `/books/${section.id}` : `/sections/${section.id}`;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedSection ? (
          <>
            <h1 className="text-3xl font-bold mb-8 text-black">{t('sections')}</h1>

            {sections.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">{t('no_results')}</p>
              </div>
            ) : (
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
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <Link to="/sections" className="text-black hover:text-gray-600 mb-4 inline-block">
                ← {t('previous')} · {t('sections')}
              </Link>
              <h1 className="text-3xl font-bold mt-4 text-black">
                {pick(selectedSection, 'title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {pick(selectedSection, 'description')}
              </p>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/section/${sectionId}/lesson/${lesson.id}`}
                  className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-black"
                >
                  <h3 className="text-xl font-semibold mb-2 text-black">
                    {pick(lesson, 'title')}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-black text-white px-2 py-1 rounded text-xs rtl:ml-2 ltr:mr-2">
                      {lesson.level ? t(lesson.level) : t('beginner')}
                    </span>
                  </div>
                </Link>
              ))}

              {lessons.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('no_results')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { SectionsPage };
