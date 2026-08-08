import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sectionsService } from '../firebase/service';
import { lessonsService } from '../firebase/service';
import { useTranslation } from 'react-i18next';

const SectionsPage = () => {
  const { sectionId } = useParams();
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadSections = async () => {
      try {
        const data = await sectionsService.getAllSections();
        setSections(data);
        if (sectionId) {
          const section = data.find(s => s.id === sectionId);
          setSelectedSection(section);
          if (section) {
            const lessonsData = await lessonsService.getLessonsBySection(sectionId);
            setLessons(lessonsData);
          }
        }
      } catch (error) {
        console.error('Error loading sections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [sectionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedSection ? (
          <>
            <h1 className="text-3xl font-bold mb-8 text-black">{t('sections')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={`/sections/${section.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-black"
                >
                  <h3 className="text-xl font-semibold mb-2 text-black">
                    {section.title_ar || section.title_en}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {section.description_ar || section.description_en}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-black text-white px-2 py-1 rounded text-xs">
                      {t('lessons')}
                    </span>
                    <span className="mr-2">0</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Link to="/sections" className="text-black hover:text-gray-600 mb-4 inline-block">
                ← {t('previous') || 'Back to Sections'}
              </Link>
              <h1 className="text-3xl font-bold mt-4 text-black">
                {selectedSection.title_ar || selectedSection.title_en}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedSection.description_ar || selectedSection.description_en}
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
                    {lesson.title_ar || lesson.title_en}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bg-black text-white px-2 py-1 rounded text-xs mr-2">
                      {lesson.level || t('beginner')}
                    </span>
                  </div>
                </Link>
              ))}
              
              {lessons.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('no_results') || 'No lessons found'}</p>
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
