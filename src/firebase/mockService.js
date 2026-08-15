// Mock (demo) service layer used when Firebase is not configured.
// All data is persisted to localStorage and seeded with the uploaded books
// (Kitab al-Tawhid, Thalathat al-Usul, Al-Aqidah al-Wasitiyyah, and
// Kashf al-Shubuhat, read as PDFs inside the application).

import { SEED_BOOKS } from '../data/books';

const KEYS = {
  seedVersion: 'fiqh_demo_seed_version',
  sections: 'fiqh_demo_sections',
  lessons: 'fiqh_demo_lessons',
  content: 'fiqh_demo_lesson_content',
  quizzes: 'fiqh_demo_quizzes',
  books: 'fiqh_demo_books',
  progress: (uid) => `fiqh_demo_progress_${uid}`,
  settings: (uid) => `fiqh_demo_settings_${uid}`,
  userId: 'userId'
};

const DEMO_USER = { uid: 'demo-user', email: 'demo@fiqh.app' };

// Bump this whenever the seeded content changes so returning users get the
// new demo data instead of a stale localStorage copy.
const SEED_VERSION = 'book-v4';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const seedSections = [
  {
    id: 'kitab-al-tawhid',
    title_ar: 'كتاب التوحيد',
    title_en: 'Kitab al-Tawhid',
    description_ar: 'كتاب للإمام المجدد محمد بن عبد الوهاب في توحيد العبادة وما يناقضه من الشرك الأكبر والأصغر، مع أدلته من الكتاب والسنة وآثار السلف، وبيان ما يجب على العبد من توحيد الله وحده.',
    description_en: 'A book by the Reviver Imam Muhammad ibn Abd al-Wahhab on the oneness of worship (Tawhid) and what negates it of major and minor shirk, with evidence from the Quran, Sunnah, and the Salaf, explaining what is incumbent upon the servant in singling out Allah alone.',
    order: 1
  },
  {
    id: 'thalatha-al-usul',
    title_ar: 'متن ثلاثة الأصول وأدلتها',
    title_en: 'Thalathat al-Usul',
    description_ar: 'متن للإمام محمد بن عبد الوهاب في الأصول الثلاثة التي يجب على كل مسلم معرفتها والعمل بها: معرفة العبد ربه، ومعرفة دينه، ومعرفة نبيه ﷺ، مع أدلتها من الكتاب والسنة.',
    description_en: 'A text by Imam Muhammad ibn Abd al-Wahhab on the three fundamentals every Muslim must know and act upon: knowing his Lord, his religion, and his Prophet, with their evidences from the Quran and Sunnah.',
    order: 2
  },
  {
    id: 'al-aqidah-al-wasitiyyah',
    title_ar: 'العقيدة الواسطية',
    title_en: 'Al-Aqidah al-Wasitiyyah',
    description_ar: 'رسالة لشيخ الإسلام ابن تيمية في بيان عقيدة أهل السنة والجماعة في أسماء الله وصفاته والقدر والإيمان واليوم الآخر، بأسلوب يعتمد على نصوص الكتاب والسنة وإجماع السلف.',
    description_en: 'A treatise by Shaykh al-Islam Ibn Taymiyyah expounding the creed of Ahl al-Sunnah wal-Jama\'ah regarding Allah\'s names and attributes, Qadar, faith, and the Hereafter, grounded in the Quran, Sunnah, and the consensus of the Salaf.',
    order: 3
  },
  {
    id: 'kashf-al-shubuhat',
    title_ar: 'كتاب كشف الشبهات',
    title_en: 'Kashf al-Shubuhat',
    description_ar: 'رسالة للإمام محمد بن عبد الوهاب تكشف الشبهات التي يثيرها المخالفون حول التوحيد وعبادة الله وحده، مع الرد عليها بالأدلة من الكتاب والسنة.',
    description_en: 'A treatise by Imam Muhammad ibn Abd al-Wahhab unveiling the ambiguities raised against Tawheed and the worship of Allah alone, responding to them with evidence from the Quran and Sunnah.',
    order: 4
  }
];

const seedLessons = [
  {
    id: 'tawhid-book',
    sectionId: 'kitab-al-tawhid',
    order: 1,
    level: 'beginner',
    pdfUrl: '/books/kitab-al-tawhid.pdf',
    pages: 168,
    title_ar: 'كتاب التوحيد — النص الكامل (PDF)',
    title_en: 'Kitab al-Tawhid — Full Text (PDF)'
  },
  {
    id: 'thalatha-book',
    sectionId: 'thalatha-al-usul',
    order: 1,
    level: 'beginner',
    pdfUrl: '/books/thalathat-al-usul.pdf',
    pages: 21,
    title_ar: 'متن ثلاثة الأصول وأدلتها — النص الكامل (PDF)',
    title_en: 'Thalathat al-Usul — Full Text (PDF)'
  },
  {
    id: 'wasitiyyah-book',
    sectionId: 'al-aqidah-al-wasitiyyah',
    order: 1,
    level: 'intermediate',
    pdfUrl: '/books/al-aqidah-al-wasitiyyah.pdf',
    pages: 160,
    title_ar: 'العقيدة الواسطية — النص الكامل (PDF)',
    title_en: 'Al-Aqidah al-Wasitiyyah — Full Text (PDF)'
  },
  {
    id: 'kashf-book',
    sectionId: 'kashf-al-shubuhat',
    order: 1,
    level: 'intermediate',
    pdfUrl: '/books/kashf-al-shubuhat.pdf',
    pages: 60,
    title_ar: 'كشف الشبهات — النص الكامل (PDF)',
    title_en: 'Kashf al-Shubuhat — Full Text (PDF)'
  }
];

// The books are read as PDFs; no text blocks or quizzes are seeded.
const seedContent = [];

const seedQuizzes = [];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Error reading mock data [${key}]:`, error);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing mock data [${key}]:`, error);
  }
};

// Seed demo data + a default user id on first run so progress persists.
// When the stored seed version differs, the seeded content is refreshed.
const ensureSeedData = () => {
  if (read(KEYS.seedVersion, null) !== SEED_VERSION) {
    write(KEYS.sections, seedSections);
    write(KEYS.lessons, seedLessons);
    write(KEYS.content, seedContent);
    write(KEYS.quizzes, seedQuizzes);
    write(KEYS.seedVersion, SEED_VERSION);
  }
  if (!localStorage.getItem(KEYS.userId)) {
    localStorage.setItem(KEYS.userId, DEMO_USER.uid);
  }
};

try {
  ensureSeedData();
} catch (error) {
  console.error('Failed to seed demo data:', error);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const mockAuthService = {
  signUp: async (email, _password) => {
    await delay();
    return { ...DEMO_USER, email };
  },
  signIn: async (email, _password) => {
    await delay();
    return { ...DEMO_USER, email };
  },
  signInWithGoogle: async () => {
    await delay();
    return { ...DEMO_USER };
  },
  signOut: async () => {
    await delay();
  },
  onAuthStateChanged: (callback) => {
    const timer = setTimeout(() => callback({ ...DEMO_USER }), 0);
    return () => clearTimeout(timer);
  },
  getCurrentUser: () => ({ ...DEMO_USER })
};

export const mockSectionsService = {
  getAllSections: async () => {
    await delay();
    return read(KEYS.sections, []);
  },
  getSectionById: async (sectionId) => {
    await delay();
    const sections = read(KEYS.sections, []);
    return sections.find((s) => s.id === sectionId) || null;
  },
  addSection: async (sectionData) => {
    await delay();
    const sections = read(KEYS.sections, []);
    const newSection = { ...sectionData, id: sectionData.id || `s-${Date.now()}` };
    write(KEYS.sections, [...sections, newSection]);
    return newSection.id;
  },
  updateSection: async (sectionId, sectionData) => {
    await delay();
    const sections = read(KEYS.sections, []);
    write(KEYS.sections, sections.map((s) => (s.id === sectionId ? { ...s, ...sectionData } : s)));
  },
  deleteSection: async (sectionId) => {
    await delay();
    write(KEYS.sections, read(KEYS.sections, []).filter((s) => s.id !== sectionId));
  },
  onSectionsChange: (callback) => {
    const push = () => callback(read(KEYS.sections, []));
    const timer = setTimeout(push, 0);
    return () => clearTimeout(timer);
  }
};

export const mockLessonsService = {
  getAllLessons: async () => {
    await delay();
    return read(KEYS.lessons, []);
  },
  getLessonsBySection: async (sectionId) => {
    await delay();
    return read(KEYS.lessons, [])
      .filter((l) => l.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  },
  getLessonById: async (lessonId) => {
    await delay();
    return read(KEYS.lessons, []).find((l) => l.id === lessonId) || null;
  },
  addLesson: async (lessonData) => {
    await delay();
    const lessons = read(KEYS.lessons, []);
    const newLesson = { ...lessonData, id: lessonData.id || `l-${Date.now()}` };
    write(KEYS.lessons, [...lessons, newLesson]);
    return newLesson.id;
  },
  updateLesson: async (lessonId, lessonData) => {
    await delay();
    const lessons = read(KEYS.lessons, []);
    write(KEYS.lessons, lessons.map((l) => (l.id === lessonId ? { ...l, ...lessonData } : l)));
  },
  deleteLesson: async (lessonId) => {
    await delay();
    write(KEYS.lessons, read(KEYS.lessons, []).filter((l) => l.id !== lessonId));
  }
};

// The library is seeded from src/data/books.js (the single place where books
// are maintained). Books added or edited through the service API are stored
// separately in localStorage and merged over the seed, so existing books are
// never replaced and new books can be added at any time.
const mergeBooks = (seed, custom) => {
  const map = new Map();
  seed.forEach((book) => map.set(book.id, book));
  custom.forEach((book) => map.set(book.id, book));
  return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
};

const getAllBooks = async () => {
  await delay();
  return mergeBooks(SEED_BOOKS, read(KEYS.books, []));
};

export const mockBooksService = {
  getAllBooks,
  getBookById: async (bookId) => {
    const books = await getAllBooks();
    return books.find((b) => b.id === bookId) || null;
  },
  addBook: async (bookData) => {
    await delay();
    const custom = read(KEYS.books, []);
    const newBook = { ...bookData, id: bookData.id || `book-${Date.now()}` };
    write(KEYS.books, [...custom, newBook]);
    return newBook.id;
  },
  updateBook: async (bookId, bookData) => {
    await delay();
    const custom = read(KEYS.books, []);
    const existing = custom.find((b) => b.id === bookId);
    // Merge with the full (seed + custom) book so updating a field never
    // drops the book's other data such as volumes, titles, or covers.
    const current = existing || (await mockBooksService.getBookById(bookId)) || {};
    const updated = { ...current, ...bookData, id: bookId };
    write(KEYS.books, [...custom.filter((b) => b.id !== bookId), updated]);
  },
  deleteBook: async (bookId) => {
    await delay();
    write(KEYS.books, read(KEYS.books, []).filter((b) => b.id !== bookId));
  },
  addVolume: async (bookId, volumeData) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = book.volumes || [];
    const newVolume = { ...volumeData, id: volumeData.id || `v-${Date.now()}` };
    await mockBooksService.updateBook(bookId, { volumes: [...volumes, newVolume] });
    return newVolume.id;
  },
  updateVolume: async (bookId, volumeId, volumeData) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = (book.volumes || []).map((v) =>
      v.id === volumeId ? { ...v, ...volumeData } : v
    );
    await mockBooksService.updateBook(bookId, { volumes });
  },
  deleteVolume: async (bookId, volumeId) => {
    await delay();
    const book = await mockBooksService.getBookById(bookId);
    if (!book) throw new Error('Book not found');
    const volumes = (book.volumes || []).filter((v) => v.id !== volumeId);
    await mockBooksService.updateBook(bookId, { volumes });
  }
};

export const mockLessonContentService = {
  getLessonContent: async (lessonId) => {
    await delay();
    const contents = read(KEYS.content, []);
    const found = contents.find((c) => c.lessonId === lessonId);
    if (found) return found;
    return { id: '', lessonId, blocks: [] };
  },
  saveLessonContent: async (contentData) => {
    await delay();
    const contents = read(KEYS.content, []);
    const existing = contents.find((c) => c.lessonId === contentData.lessonId);
    if (existing) {
      const updated = { ...existing, ...contentData };
      write(KEYS.content, contents.map((c) => (c.id === existing.id ? updated : c)));
      return existing.id;
    }
    const newContent = { ...contentData, id: contentData.id || `c-${Date.now()}` };
    write(KEYS.content, [...contents, newContent]);
    return newContent.id;
  }
};

export const mockQuizzesService = {
  getQuizByLesson: async (lessonId) => {
    await delay();
    return read(KEYS.quizzes, []).filter((q) => q.lessonId === lessonId);
  },
  getQuizById: async (quizId) => {
    await delay();
    return read(KEYS.quizzes, []).find((q) => q.id === quizId) || null;
  },
  addQuiz: async (quizData) => {
    await delay();
    const quizzes = read(KEYS.quizzes, []);
    const newQuiz = { ...quizData, id: quizData.id || `q-${Date.now()}` };
    write(KEYS.quizzes, [...quizzes, newQuiz]);
    return newQuiz.id;
  },
  updateQuiz: async (quizId, quizData) => {
    await delay();
    const quizzes = read(KEYS.quizzes, []);
    write(KEYS.quizzes, quizzes.map((q) => (q.id === quizId ? { ...q, ...quizData } : q)));
  },
  deleteQuiz: async (quizId) => {
    await delay();
    write(KEYS.quizzes, read(KEYS.quizzes, []).filter((q) => q.id !== quizId));
  }
};

export const mockUserProgressService = {
  getUserProgress: async (userId) => {
    await delay();
    if (!userId) return null;
    const stored = read(KEYS.progress(userId), null);
    if (stored) return stored;
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
    await delay();
    if (!progressData.userId) return null;
    const existing = read(KEYS.progress(progressData.userId), null);
    const dataToSave = {
      ...progressData,
      id: progressData.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    write(KEYS.progress(progressData.userId), dataToSave);
    return progressData.userId;
  },
  addCompletedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const completedLessons = [...new Set([...progress.completedLessons, lessonId])];
      await mockUserProgressService.saveUserProgress({
        ...progress,
        completedLessons,
        lastOpened: lessonId
      });
    }
  },
  addBookmarkedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = [...new Set([...progress.bookmarkedLessons, lessonId])];
      await mockUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  },
  removeBookmarkedLesson: async (userId, lessonId) => {
    const progress = await mockUserProgressService.getUserProgress(userId);
    if (progress) {
      const bookmarkedLessons = progress.bookmarkedLessons.filter((id) => id !== lessonId);
      await mockUserProgressService.saveUserProgress({ ...progress, bookmarkedLessons });
    }
  }
};

export const mockAppSettingsService = {
  getAppSettings: async (userId) => {
    await delay();
    if (!userId) return null;
    const stored = read(KEYS.settings(userId), null);
    if (stored) return stored;
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
    await delay();
    if (!settingsData.userId) return null;
    const existing = read(KEYS.settings(settingsData.userId), null);
    const dataToSave = {
      ...settingsData,
      id: settingsData.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    write(KEYS.settings(settingsData.userId), dataToSave);
    return settingsData.userId;
  }
};

export default {
  auth: mockAuthService,
  sections: mockSectionsService,
  lessons: mockLessonsService,
  lessonContent: mockLessonContentService,
  quizzes: mockQuizzesService,
  books: mockBooksService,
  userProgress: mockUserProgressService,
  appSettings: mockAppSettingsService
};
