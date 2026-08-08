import { useState, useCallback } from 'react';
import { lessonContentService } from '../firebase/service';

export const useLessonContentService = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLessonContent = useCallback(async (lessonId) => {
    if (!lessonId) {
      setContent(null);
      return;
    }

    setLoading(true);
    try {
      const contentData = await lessonContentService.getLessonContent(lessonId);
      setContent(contentData);
    } catch (err) {
      setError(err);
      console.error('Error fetching lesson content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLessonContent = useCallback(async (contentData) => {
    setLoading(true);
    try {
      const result = await lessonContentService.saveLessonContent(contentData);
      return result;
    } catch (err) {
      setError(err);
      console.error('Error saving lesson content:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    content,
    loading,
    error,
    loadLessonContent,
    saveLessonContent
  };
};
