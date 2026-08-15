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
import firebaseConfig, { isFirebaseConfigured } from './config';
import {
  mockAuthService,
  mockSectionsService,
  mockLessonsService,
  mockLessonContentService,
  mockQuizzesService,
  mockUserProgressService,
  mockAppSettingsService
} from './mockService';

// Firebase is only initialized when real credentials are present.
// Otherwise the application runs in demo mode against local mock data.
export const isDemoMode = !isFirebaseConfigured();

let db = null;
let auth = null;
let googleProvider = null;

if (!isDemoMode) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });

  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

if (isDemoMode) {
  console.info(
    'Firebase not configured — running in demo mode with locally seeded content. ' +
    'Add your credentials in src/firebase/config.js to enable the real backend.'
  );
}

// ---------------------------------------------------------------------------
// Real Firebase service implementations
// ---------------------------------------------------------------------------

const realAuthService = {
  signUp: async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  signIn: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },
  signOut: async () => {
    await signOut(auth);
  },
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },
  getCurrentUser: () => auth.currentUser
};

const realSectionsService = {
  getAllSections: async () => {
    const sectionsSnapshot = await getDocs(collection(db, 'sections'));
    return sectionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
  getSectionById: async (sectionId) => {
    const sectionSnap = await getDoc(doc(db, 'sections', sectionId));
    if (sectionSnap.exists()) return { id: sectionSnap.id, ...sectionSnap.data() };
    return null;
  },
  addSection: async (sectionData) => {
    const docRef = await addDoc(collection(db, 'sections'), sectionData);
    return docRef.id;
  },
  updateSection: async (sectionId, sectionData) => {
    await updateDoc(doc(db, 'sections', sectionId), sectionData);
  },
  deleteSection: async (sectionId) => {
    await deleteDoc(doc(db, 'sections', sectionId));
  },
  onSectionsChange: (callback) => {
    return onSnapshot(collection(db, 'sections'), (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }
};

const realLessonsService = {
  getAllLessons: async () => {
    const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
    return lessonsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
  getLessonsBySection: async (sectionId) => {
    const q = query(collection(db, 'lessons'), where('sectionId', '==', sectionId), orderBy('order'));
    const lessonsSnapshot = await getDocs(q);
    return lessonsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
  getLessonById: async (lessonId) => {
    const lessonSnap = await getDoc(doc(db, 'lessons', lessonId));
    if (lessonSnap.exists()) return { id: lessonSnap.id, ...lessonSnap.data() };
    return null;
  },
  addLesson: async (lessonData) => {
    const docRef = await addDoc(collection(db, 'lessons'), lessonData);
    return docRef.id;
  },
  updateLesson: async (lessonId, lessonData) => {
    await updateDoc(doc(db, 'lessons', lessonId), lessonData);
  },
  deleteLesson: async (lessonId) => {
    await deleteDoc(doc(db, 'lessons', lessonId));
  }
};

const realLessonContentService = {
  getLessonContent: async (lessonId) => {
    const q = query(collection(db, 'lesson_content'), where('lessonId', '==', lessonId));
    const contentSnapshot = await getDocs(q);
    if (!contentSnapshot.empty) {
      const contentDoc = contentSnapshot.docs[0];
      return { id: contentDoc.id, ...contentDoc.data() };
    }
    return { id: '', lessonId, blocks: [] };
  },
  saveLessonContent: async (contentData) => {
    const existingQuery = query(collection(db, 'lesson_content'), where('lessonId', '==', contentData.lessonId));
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      await updateDoc(doc(db, 'lesson_content', existingDoc.id), contentData);
      return existingDoc.id;
    }
    const docRef = await addDoc(collection(db, 'lesson_content'), contentData);
    return docRef.id;
  }
};

const realQuizzesService = {
  getQuizByLesson: async (lessonId) => {
    const q = query(collection(db, 'quizzes'), where('lessonId', '==', lessonId));
    const quizzesSnapshot = await getDocs(q);
    return quizzesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
  getQuizById: async (quizId) => {
    const quizSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (quizSnap.exists()) return { id: quizSnap.id, ...quizSnap.data() };
    return null;
  },
  addQuiz: async (quizData) => {
    const docRef = await addDoc(collection(db, 'quizzes'), quizData);
    return docRef.id;
  },
  updateQuiz: async (quizId, quizData) => {
    await updateDoc(doc(db, 'quizzes', quizId), quizData);
  },
  deleteQuiz: async (quizId) => {
    await deleteDoc(doc(db, 'quizzes', quizId));
  }
};

const realUserProgressService = {
  getUserProgress: async (userId) => {
    if (!userId) return null;
    const progressSnap = await getDoc(doc(db, 'user_progress', userId));
    if (progressSnap.exists()) return { id: progressSnap.id, ...progressSnap.data() };
    const now = new Date().toISOString();
    return {
      id: userId,
      userId,
      completedLessons: [],
      bookmarkedLessons: [],
      lastOpened: null,
      streaks: 0,
      createdAt: now,
      updatedAt: now
    };
  },
  saveUserProgress: async (progressData) => {
    if (!progressData.userId) return null;
    const progressDoc = doc(db, 'user_progress', progressData.userId);
    const dataToSave = { ...progressData, updatedAt: new Date().toISOString() };
    const progressSnap = await getDoc(progressDoc);
    if (progressSnap.exists()) {
      await updateDoc(progressDoc, dataToSave);
    } else {
      dataToSave.createdAt = new Date().toISOString();
      await setDoc(progressDoc, dataToSave);
    }
    return progressData.userId;
  },
  addCompletedLesson: async (userId, lessonId) => {
    const progress = await realUserProgressService.getUserProgress(userId);
    if (progress) {
      const completedLessons = [...new Set([...progress.completedLessons, lessonId])];
      await realUserProgressService.saveUserProgress({ ...progress, completedLessons, lastOpened: lessonId });
    }
  },
  addBookmarkedLesson: async (userId, lessonId) => {
    const progress = await realUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = [...new Set([...progress.bookmarkedLessons, lessonId])];
      await realUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  },
  removeBookmarkedLesson: async (userId, lessonId) => {
    const progress = await realUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = progress.bookmarkedLessons.filter((id) => id !== lessonId);
      await realUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  }
};

const realAppSettingsService = {
  getAppSettings: async (userId) => {
    if (!userId) return null;
    const settingsSnap = await getDoc(doc(db, 'app_settings', userId));
    if (settingsSnap.exists()) return { id: settingsSnap.id, ...settingsSnap.data() };
    const now = new Date().toISOString();
    return {
      id: userId,
      userId,
      language: 'ar',
      fontSize: 'medium',
      theme: 'light',
      createdAt: now,
      updatedAt: now
    };
  },
  saveAppSettings: async (settingsData) => {
    if (!settingsData.userId) return null;
    const settingsDoc = doc(db, 'app_settings', settingsData.userId);
    const dataToSave = { ...settingsData, updatedAt: new Date().toISOString() };
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

// ---------------------------------------------------------------------------
// Exports (real Firebase or mock depending on configuration)
// ---------------------------------------------------------------------------

export const authService = isDemoMode ? mockAuthService : realAuthService;
export const sectionsService = isDemoMode ? mockSectionsService : realSectionsService;
export const lessonsService = isDemoMode ? mockLessonsService : realLessonsService;
export const lessonContentService = isDemoMode ? mockLessonContentService : realLessonContentService;
export const quizzesService = isDemoMode ? mockQuizzesService : realQuizzesService;
export const userProgressService = isDemoMode ? mockUserProgressService : realUserProgressService;
export const appSettingsService = isDemoMode ? mockAppSettingsService : realAppSettingsService;

export default {
  auth: authService,
  sections: sectionsService,
  lessons: lessonsService,
  lessonContent: lessonContentService,
  quizzes: quizzesService,
  userProgress: userProgressService,
  appSettings: appSettingsService
};
