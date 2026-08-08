import { useState, useEffect, createContext, useContext } from 'react';
import { userProgressService } from '../firebase/service';

const UserProgressContext = createContext(null);

export const UserProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      setLoading(true);
      try {
        const userProgress = await userProgressService.getUserProgress(userId);
        setProgress(userProgress);
      } catch (error) {
        console.error('Error fetching user progress:', error);
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId]);

  const updateUserId = useCallback((id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
  }, []);

  const resetUserId = useCallback(() => {
    setUserId(null);
    localStorage.removeItem('userId');
    setProgress(null);
  }, []);

  const markLessonCompleted = useCallback(async (lessonId) => {
    if (!userId) return;
    
    try {
      await userProgressService.addCompletedLesson(userId, lessonId);
      setProgress(prev => {
        if (!prev) return prev;
        const completedLessons = [...new Set([...prev.completedLessons, lessonId])];
        return {
          ...prev,
          completedLessons,
          lastOpened: lessonId
        };
      });
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      throw error;
    }
  }, [userId]);

  const addBookmark = useCallback(async (lessonId) => {
    if (!userId) return;
    
    try {
      await userProgressService.addBookmarkedLesson(userId, lessonId);
      setProgress(prev => {
        if (!prev) return prev;
        const bookmarkedLessons = [...new Set([...prev.bookmarkedLessons, lessonId])];
        return {
          ...prev,
          bookmarkedLessons
        };
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }, [userId]);

  const removeBookmark = useCallback(async (lessonId) => {
    if (!userId) return;
    
    try {
      await userProgressService.removeBookmarkedLesson(userId, lessonId);
      setProgress(prev => {
        if (!prev) return prev;
        const bookmarkedLessons = prev.bookmarkedLessons.filter(id => id !== lessonId);
        return {
          ...prev,
          bookmarkedLessons
        };
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }, [userId]);

  const updateLastOpened = useCallback(async (lessonId) => {
    if (!userId) return;
    
    try {
      await userProgressService.saveUserProgress({
        userId,
        lastOpened: lessonId,
        ...(progress || {})
      });
      setProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          lastOpened: lessonId
        };
      });
    } catch (error) {
      console.error('Error updating last opened lesson:', error);
      throw error;
    }
  }, [userId, progress]);

  return (
    <UserProgressContext.Provider value={{ 
      progress, 
      loading, 
      userId, 
      updateUserId, 
      resetUserId, 
      markLessonCompleted, 
      addBookmark, 
      removeBookmark, 
      updateLastOpened 
    }}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error('useUserProgress must be used within an UserProgressProvider');
  }
  return context;
};
