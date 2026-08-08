import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lessonsService, lessonContentService } from '../firebase/service';
import { useUserProgress } from '../hooks/useUserProgress';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../utils/helpers';

const fontSizeClass = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg'
};

const LessonDetailPage = () => {
  const { sectionId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { markLessonCompleted, addBookmark, removeBookmark, progress } = useUserProgress();
  const { settings } = useAppSettings();
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      try {
        const [lessonData, contentData, sectionLessons] = await Promise.all([
          lessonsService.getLessonById(lessonId),
          lessonContentService.getLessonContent(lessonId),
          lessonsService.getLessonsBySection(sectionId)
        ]);

        setLesson(lessonData);
        setContent(contentData);
        setSiblings(sectionLessons);

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
    setReadingProgress(0);
  }, [lessonId, sectionId, progress]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const value = max > 0 ? (el.scrollTop / max) * 100 : 0;
    setReadingProgress(Math.round(value));
  }, []);

  const handleToggleComplete = async () => {
    try {
      if (isCompleted) {
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">{t('error_occurred')}</p>
      </div>
    );
  }

  const currentIndex = siblings.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'heading':
        return (
          <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-black">
            {pick(block, 'content')}
          </h2>
        );
      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-gray-800 leading-relaxed">
            {pick(block, 'content')}
          </p>
        );
      case 'note':
        return (
          <div key={index} className="bg-gray-50 border-r-4 border-black rtl:border-r-0 rtl:border-l-4 p-4 mb-4 rounded">
            <p className="text-gray-800">{pick(block, 'content')}</p>
          </div>
        );
      case 'list':
        return (
          <ul key={index} className="list-disc list-inside mb-4 space-y-2">
            {(pick(block, 'content') || '').split('\n').map((item, i) => (
              <li key={i} className="text-gray-800">{item}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/sections/${sectionId}`} className="text-black hover:text-gray-600 mb-4 inline-block">
            ← {t('previous')} · {t('browse_sections')}
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">{pick(lesson, 'title')}</h1>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <span className="bg-black text-white px-3 py-1 rounded text-sm">
              {lesson.level ? t(lesson.level) : t('beginner')}
            </span>
            <span className="text-gray-600">{t('section_description')}</span>
          </div>
        </div>

        {/* Reading progress */}
        <div className="sticky top-16 z-30 mb-6 bg-white">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>{t('reading_progress')}</span>
            <span>{readingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className={`max-h-[60vh] overflow-y-auto ${fontSizeClass[settings?.fontSize] || 'text-base'}`}
        >
          {(content?.blocks?.length ? content.blocks : []).map(renderBlock) ||
            <p className="text-gray-500">{t('no_results')}</p>}
          {content && content.blocks && content.blocks.length === 0 && (
            <p className="text-gray-500">{t('no_results')}</p>
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

        {/* Prev / Next */}
        <div className="flex justify-between items-center gap-4 mt-8 border-t border-gray-200 pt-6">
          {prevLesson ? (
            <Link
              to={`/section/${sectionId}/lesson/${prevLesson.id}`}
              className="flex-1 px-4 py-3 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors text-center"
            >
              <span className="block text-xs text-gray-500 mb-1">{t('previous')}</span>
              <span className="font-medium">{pick(prevLesson, 'title')}</span>
            </Link>
          ) : (
            <span className="flex-1"></span>
          )}
          {nextLesson ? (
            <Link
              to={`/section/${sectionId}/lesson/${nextLesson.id}`}
              className="flex-1 px-4 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors text-center"
            >
              <span className="block text-xs text-gray-400 mb-1">{t('next')}</span>
              <span className="font-medium">{pick(nextLesson, 'title')}</span>
            </Link>
          ) : (
            <span className="flex-1"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export { LessonDetailPage };
