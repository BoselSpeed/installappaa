import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { lessonsService, sectionsService, lessonContentService } from '../firebase/service';
import { SearchBar } from '../components/UI/SearchBar';
import { useTranslation } from 'react-i18next';
import { lessonUrl, useLocalized, highlight } from '../utils/helpers';

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
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar placeholder={t('search_placeholder')} />
        </div>

        {!query ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('search_placeholder')}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {searched && lessonResults.length === 0 && sectionResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('no_results')}</p>
                <p className="text-gray-400 mt-2">{t('try_another_search')}</p>
              </div>
            )}

            {lessonResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-black">{t('lessons')}</h2>
                <div className="space-y-4">
                  {lessonResults.map(({ lesson, section }) => (
                    <Link
                      key={lesson.id}
                      to={lessonUrl(lesson)}
                      className="block bg-white rounded-lg shadow-md p-6 border border-black hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-black">
                          {highlight(pick(lesson, 'title'), query)}
                        </h3>
                        {section && (
                          <span className="bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap rtl:mr-2 ltr:ml-2">
                            {pick(section, 'title')}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {section ? pick(section, 'description') : t('lessons')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {sectionResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-black">{t('sections')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sectionResults.map((section) => (
                    <Link
                      key={section.id}
                      to={`/sections/${section.id}`}
                      className="bg-white rounded-lg shadow-md p-6 border border-black hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {highlight(pick(section, 'title'), query)}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {highlight(pick(section, 'description'), query)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { SearchPage };
