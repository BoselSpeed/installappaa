/**
 * The application's data layer.
 *
 * Everything lives on the device: books and sections are seeded from
 * `src/data/books.js` into localStorage on first run, and anything the reader
 * writes — notes, progress, settings, favourites — goes back to the same store.
 * There is no remote backend and no account, which is why the app works offline
 * and why installing it needs no credentials.
 *
 * The service objects themselves live in `localService.js`. They are re-exported
 * here under the plain names the pages and hooks import, so a page reads
 * `import { booksService } from '../services/appService'` and never has to know
 * which store is behind it.
 */

import {
  mockAuthService as authService,
  mockSectionsService as sectionsService,
  mockLessonsService as lessonsService,
  mockLessonContentService as lessonContentService,
  mockQuizzesService as quizzesService,
  mockBooksService as booksService,
  mockUserProgressService as userProgressService,
  mockAppSettingsService as appSettingsService,
  mockNotesService as notesService,
  mockSearchHistoryService as searchHistoryService
} from './localService';

export {
  authService,
  sectionsService,
  lessonsService,
  lessonContentService,
  quizzesService,
  booksService,
  userProgressService,
  appSettingsService,
  notesService,
  searchHistoryService
};

export default {
  auth: authService,
  sections: sectionsService,
  lessons: lessonsService,
  lessonContent: lessonContentService,
  quizzes: quizzesService,
  books: booksService,
  userProgress: userProgressService,
  appSettings: appSettingsService,
  notes: notesService,
  searchHistory: searchHistoryService
};