import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsService } from '../firebase/service';
import { lessonContentService } from '../firebase/service';
import { useUserProgress } from '../hooks/useUserProgress';
import { useTranslation } from 'react-i18next';

const LessonDetailPage = () => {
  const { sectionId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { markLessonCompleted, addBookmark, removeBookmark, progress } = useUserProgress();
  const { t } = useTranslation();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const lessonData = await lessonsService.getLessonById(lessonId);
        setLesson(lessonData);
        
        const contentData = await lessonContentService.getLessonContent(lessonId);
        setContent(contentData);
        
        // Check if lesson is completed or bookmarked
        if (progress) {
          setIsCompleted(progress.completedLessons?.includes(lessonId));
          setIsBookmarked(progress.bookmarkedLessons?.includes(lessonId));
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, progress]);

  const handleToggleComplete = async () => {
    try {
      if (isCompleted) {
        // Remove from completed (implement in service)
        setIsCompleted(false);
      } else {
        await markLessonCompleted(lessonId);
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark(lessonId);
        setIsBookmarked(false);
      } else {
        await addBookmark(lessonId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/sections/${sectionId}`} className="text-black hover:text-gray-600 mb-4 inline-block">
            ← {t('previous') || 'Back to Section'}
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">
            {lesson.title_ar || lesson.title_en}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="bg-black text-white px-3 py-1 rounded text-sm">
              {lesson.level || t('beginner')}
            </span>
            <span className="text-gray-600">{t('section_description')}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-8">
          {content?.blocks?.map((block, index) => {
            switch (block.type) {
              case 'heading':
                return (
                  <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-black">
                    {block.content_ar || block.content_en}
                  </h2>
                );
              case 'paragraph':
                return (
                  <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                    {block.content_ar || block.content_en}
                  </p>
                );
              case 'note':
                return (
                  <div key={index} className="bg-gray-50 border-r-4 border-black p-4 mb-4">
                    <p className="text-gray-800">{block.content_ar || block.content_en}</p>
                  </div>
                );
              case 'list':
                return (
                  <ul key={index} className="list-disc list-inside mb-4 space-y-2">
                    {(block.content_ar || block.content_en).split('\n').map((item, i) => (
                      <li key={i} className="text-gray-800">{item}</li>
                    ))}
                  </ul>
                );
              default:
                return null;
            }
          }) || (
            <p className="text-gray-500">{t('no_results') || 'No content available'}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-200">
          <button
            onClick={handleToggleComplete}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isCompleted
                ? 'bg-black text-white'
                : 'bg-white text-black border border-black hover:bg-gray-50'
            }`}
          >
            {isCompleted ? t('completed') : t('mark_complete')}
          </button>
          
          <button
            onClick={handleToggleBookmark}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isBookmarked
                ? 'bg-black text-white'
                : 'bg-white text-black border border-black hover:bg-gray-50'
            }`}
          >
            {isBookmarked ? t('bookmarked') : t('bookmark')}
          </button>
          
          <Link
            to={`/quiz/${lessonId}`}
            className="px-6 py-3 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors text-center"
          >
            {t('quiz')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export { LessonDetailPage };
