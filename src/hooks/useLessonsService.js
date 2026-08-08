import { useState, useEffect, useCallback } from 'react';
import { lessonsService } from '../firebase/service';

export const useLessonsService = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLessonsBySection = useCallback(async (sectionId) => {
    if (!sectionId) {
      setLessons([]);
      return;
    }

    setLoading(true);
    try {
      const lessonsData = await lessonsService.getLessonsBySection(sectionId);
      setLessons(lessonsData);
    } catch (err) {
      setError(err);
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLessonById = useCallback(async (lessonId) => {
    if (!lessonId) return null;
    try {
      return await lessonsService.getLessonById(lessonId);
    } catch (error) {
      console.error('Error fetching lesson by ID:', error);
      return null;
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    loadLessonsBySection,
    getLessonById
  };
};
