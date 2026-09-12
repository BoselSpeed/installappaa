import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { notesService } from '../firebase/service';

const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notesMap, setNotesMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadNotesForLesson = useCallback(async (lessonId) => {
    try {
      const notes = await notesService.getNotesByLesson(lessonId);
      setNotesMap(prev => ({ ...prev, [lessonId]: notes }));
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, []);

  const addNote = useCallback(async (lessonId, text, type = 'note') => {
    try {
      const noteData = { lessonId, text, type };
      const noteId = await notesService.addNote(noteData);
      const newNote = { ...noteData, id: noteId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setNotesMap(prev => ({
        ...prev,
        [lessonId]: [newNote, ...(prev[lessonId] || [])]
      }));
      return noteId;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }, []);

  const updateNote = useCallback(async (lessonId, noteId, text) => {
    try {
      await notesService.updateNote(noteId, { text });
      setNotesMap(prev => ({
        ...prev,
        [lessonId]: (prev[lessonId] || []).map((n) => (n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n))
      }));
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }, []);

  const deleteNote = useCallback(async (lessonId, noteId) => {
    try {
      await notesService.deleteNote(noteId);
      setNotesMap(prev => ({
        ...prev,
        [lessonId]: (prev[lessonId] || []).filter((n) => n.id !== noteId)
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, []);

  const getNotesForLesson = useCallback((lessonId) => {
    return notesMap[lessonId] || [];
  }, [notesMap]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <NotesContext.Provider value={{ notesMap, loading, loadNotesForLesson, addNote, updateNote, deleteNote, getNotesForLesson }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
