import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lessonsService } from '../firebase/service';
import { sectionsService } from '../firebase/service';
import { SearchBar } from '../components/UI/SearchBar';
import { useTranslation } from 'react-i18next';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [lessons, setLessons] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        // Search in lessons
        const allLessons = await lessonsService.getLessonsBySection();
        const filteredLessons = allLessons.filter(lesson => 
          (lesson.title_ar?.includes(query) || lesson.title_en?.toLowerCase().includes(query.toLowerCase())) ||
          (lesson.content_ar?.includes(query) || lesson.content_en?.toLowerCase().includes(query.toLowerCase()))
        );
        setLessons(filteredLessons);

        // Search in sections
        const allSections = await sectionsService.getAllSections();
        const filteredSections = allSections.filter(section => 
          (section.title_ar?.includes(query) || section.title_en?.toLowerCase().includes(query.toLowerCase()))
        );
        setSections(filteredSections);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar placeholder={t('search_placeholder')} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Lessons Results */}
            {lessons.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-black">{t('lessons')}</h2>
                <div className="space-y-4">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="bg-white rounded-lg shadow-md p-6 border border-black">
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {lesson.title_ar || lesson.title_en}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {lesson.content_ar?.substring(0, 200) || lesson.content_en?.substring(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sections Results */}
            {sections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-black">{t('sections')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map((section) => (
                    <div key={section.id} className="bg-white rounded-lg shadow-md p-6 border border-black">
                      <h3 className="text-xl font-semibold text-black mb-2">
                        {section.title_ar || section.title_en}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {section.description_ar || section.description_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {lessons.length === 0 && sections.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('no_results')}</p>
                <p className="text-gray-400 mt-2">{t('try_another_search')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { SearchPage };
