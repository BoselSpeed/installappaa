import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth Service
export const authService = {
  // Sign up with email/password
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign in with email/password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Auth state listener
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

// Firestore Service for Sections
export const sectionsService = {
  // Get all sections
  getAllSections: async () => {
    const sectionsCol = collection(db, 'sections');
    const sectionsSnapshot = await getDocs(sectionsCol);
    return sectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get section by ID
  getSectionById: async (sectionId) => {
    const sectionDoc = doc(db, 'sections', sectionId);
    const sectionSnap = await getDoc(sectionDoc);
    if (sectionSnap.exists()) {
      return { id: sectionSnap.id, ...sectionSnap.data() };
    }
    return null;
  },

  // Add a new section
  addSection: async (sectionData) => {
    const sectionsCol = collection(db, 'sections');
    const docRef = await addDoc(sectionsCol, sectionData);
    return docRef.id;
  },

  // Update section
  updateSection: async (sectionId, sectionData) => {
    const sectionDoc = doc(db, 'sections', sectionId);
    await updateDoc(sectionDoc, sectionData);
  },

  // Delete section
  deleteSection: async (sectionId) => {
    const sectionDoc = doc(db, 'sections', sectionId);
    await deleteDoc(sectionDoc);
  },

  // Listen to sections changes
  onSectionsChange: (callback) => {
    const sectionsCol = collection(db, 'sections');
    return onSnapshot(sectionsCol, (snapshot) => {
      const sections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sections);
    });
  }
};

// Firestore Service for Lessons
export const lessonsService = {
  // Get lessons by section ID
  getLessonsBySection: async (sectionId) => {
    const lessonsCol = collection(db, 'lessons');
    const q = query(lessonsCol, where('sectionId', '==', sectionId), orderBy('order'));
    const lessonsSnapshot = await getDocs(q);
    return lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get lesson by ID
  getLessonById: async (lessonId) => {
    const lessonDoc = doc(db, 'lessons', lessonId);
    const lessonSnap = await getDoc(lessonDoc);
    if (lessonSnap.exists()) {
      return { id: lessonSnap.id, ...lessonSnap.data() };
    }
    return null;
  },

  // Add a new lesson
  addLesson: async (lessonData) => {
    const lessonsCol = collection(db, 'lessons');
    const docRef = await addDoc(lessonsCol, lessonData);
    return docRef.id;
  },

  // Update lesson
  updateLesson: async (lessonId, lessonData) => {
    const lessonDoc = doc(db, 'lessons', lessonId);
    await updateDoc(lessonDoc, lessonData);
  },

  // Delete lesson
  deleteLesson: async (lessonId) => {
    const lessonDoc = doc(db, 'lessons', lessonId);
    await deleteDoc(lessonDoc);
  }
};

// Firestore Service for Lesson Content
export const lessonContentService = {
  // Get lesson content by lesson ID
  getLessonContent: async (lessonId) => {
    // Assuming we have a lesson_content collection
    const contentCol = collection(db, 'lesson_content');
    const q = query(contentCol, where('lessonId', '==', lessonId));
    const contentSnapshot = await getDocs(q);
    
    if (!contentSnapshot.empty) {
      // Return the first matching document's content blocks
      const contentDoc = contentSnapshot.docs[0];
      return { id: contentDoc.id, ...contentDoc.data() };
    }
    
    // Return empty content structure if not found
    return {
      id: '',
      lessonId: lessonId,
      blocks: []
    };
  },

  // Save lesson content
  saveLessonContent: async (contentData) => {
    const contentCol = collection(db, 'lesson_content');
    // Check if content already exists for this lesson
    const existingQuery = query(contentCol, where('lessonId', '==', contentData.lessonId));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Update existing document
      const existingDoc = existingSnapshot.docs[0];
      const contentDoc = doc(db, 'lesson_content', existingDoc.id);
      await updateDoc(contentDoc, contentData);
      return existingDoc.id;
    } else {
      // Create new document
      const docRef = await addDoc(contentCol, contentData);
      return docRef.id;
    }
  }
};

// Firestore Service for Quizzes
export const quizzesService = {
  // Get quizzes by lesson ID
  getQuizByLesson: async (lessonId) => {
    const quizzesCol = collection(db, 'quizzes');
    const q = query(quizzesCol, where('lessonId', '==', lessonId));
    const quizzesSnapshot = await getDocs(q);
    return quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get quiz by ID
  getQuizById: async (quizId) => {
    const quizDoc = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizDoc);
    if (quizSnap.exists()) {
      return { id: quizSnap.id, ...quizSnap.data() };
    }
    return null;
  },

  // Add a new quiz
  addQuiz: async (quizData) => {
    const quizzesCol = collection(db, 'quizzes');
    const docRef = await addDoc(quizzesCol, quizData);
    return docRef.id;
  },

  // Update quiz
  updateQuiz: async (quizId, quizData) => {
    const quizDoc = doc(db, 'quizzes', quizId);
    await updateDoc(quizDoc, quizData);
  },

  // Delete quiz
  deleteQuiz: async (quizId) => {
    const quizDoc = doc(db, 'quizzes', quizId);
    await deleteDoc(quizDoc);
  }
};

// Firestore Service for User Progress
export const userProgressService = {
  // Get user progress
  getUserProgress: async (userId) => {
    if (!userId) return null;
    
    const progressDoc = doc(db, 'user_progress', userId);
    const progressSnap = await getDoc(progressDoc);
    if (progressSnap.exists()) {
      return { id: progressSnap.id, ...progressSnap.data() };
    }
    
    // Return default progress structure
    return {
      id: userId,
      userId: userId,
      completedLessons: [],
      bookmarkedLessons: [],
      lastOpened: null,
      streaks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Save user progress
  saveUserProgress: async (progressData) => {
    if (!progressData.userId) return null;
    
    const progressDoc = doc(db, 'user_progress', progressData.userId);
    const dataToSave = {
      ...progressData,
      updatedAt: new Date().toISOString()
    };
    
    // Check if document exists
    const progressSnap = await getDoc(progressDoc);
    if (progressSnap.exists()) {
      await updateDoc(progressDoc, dataToSave);
    } else {
      dataToSave.createdAt = new Date().toISOString();
      await setDoc(progressDoc, dataToSave);
    }
    
    return progressData.userId;
  },

  // Add completed lesson
  addCompletedLesson: async (userId, lessonId) => {
    const progress = await userProgressService.getUserProgress(userId);
    if (progress) {
      const completedLessons = [...new Set([...progress.completedLessons, lessonId])];
      await userProgressService.saveUserProgress({
        ...progress,
        completedLessons,
        lastOpened: lessonId
      });
    }
  },

  // Add bookmarked lesson
  addBookmarkedLesson: async (userId, lessonId) => {
    const progress = await userProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = [...new Set([...progress.bookmarkedLessons, lessonId])];
      await userProgressService.saveUserProgress({
        ...progress,
        bookmarkedLessons
      });
    }
  },

  // Remove bookmarked lesson
  removeBookmarkedLesson: async (userId, lessonId) => {
    const progress = await userProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = progress.bookmarkedLessons.filter(id => id !== lessonId);
      await userProgressService.saveUserProgress({
        ...progress,
        bookmarkedLessons
      });
    }
  }
};

// Firestore Service for App Settings
export const appSettingsService = {
  // Get app settings for user
  getAppSettings: async (userId) => {
    if (!userId) return null;
    
    const settingsDoc = doc(db, 'app_settings', userId);
    const settingsSnap = await getDoc(settingsDoc);
    if (settingsSnap.exists()) {
      return { id: settingsSnap.id, ...settingsSnap.data() };
    }
    
    // Return default settings
    return {
      id: userId,
      userId: userId,
      language: navigator.language.startsWith('ar') ? 'ar' : 'en',
      fontSize: 'medium', // small, medium, large
      theme: 'light', // light, dark (though we only use light for now)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Save app settings
  saveAppSettings: async (settingsData) => {
    if (!settingsData.userId) return null;
    
    const settingsDoc = doc(db, 'app_settings', settingsData.userId);
    const dataToSave = {
      ...settingsData,
      updatedAt: new Date().toISOString()
    };
    
    // Check if document exists
    const settingsSnap = await getDoc(settingsDoc);
    if (settingsSnap.exists()) {
      await updateDoc(settingsDoc, dataToSave);
    } else {
      dataToSave.createdAt = new Date().toISOString();
      await setDoc(settingsDoc, dataToSave);
    }
    
    return settingsData.userId;
  }
};

export default {
  auth: authService,
  sections: sectionsService,
  lessons: lessonsService,
  lessonContent: lessonContentService,
  quizzes: quizzesService,
  userProgress: userProgressService,
  appSettings: appSettingsService
};
