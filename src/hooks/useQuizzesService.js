import { useState, useCallback } from 'react';
import { quizzesService } from '../firebase/service';

export const useQuizzesService = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadQuizByLesson = useCallback(async (lessonId) => {
    if (!lessonId) {
      setQuiz(null);
      return;
    }

    setLoading(true);
    try {
      const quizzesData = await quizzesService.getQuizByLesson(lessonId);
      // Assuming one quiz per lesson for simplicity
      setQuiz(quizzesData[0] || null);
    } catch (err) {
      setError(err);
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuizById = useCallback(async (quizId) => {
    if (!quizId) return null;
    try {
      return await quizzesService.getQuizById(quizId);
    } catch (error) {
      console.error('Error fetching quiz by ID:', error);
      return null;
    }
  }, []);

  return {
    quiz,
    loading,
    error,
    loadQuizByLesson,
    getQuizById
  };
};
