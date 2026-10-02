# Islamic Fiqh Learning Application - Implementation Plan

> **Status note.** Everything below the "Overview" section is the *original*
> implementation plan, written before the library was expanded. Its checkboxes
> are historical and no longer track reality — several items marked `[ ]` were in
> fact built (the whole design system in Phase 2, the UI primitives, auth hooks,
> settings, streaks, notes, search history, achievements). Read the
> "Implementation Status" block above it for what is actually true today, and the
> issue list at the end of this file for what is genuinely outstanding.

## Implementation Status
**Last updated:** 2026-10-01

The application is functional end-to-end in **demo mode**: it runs entirely with
locally seeded bilingual content when Firebase credentials are absent, and
automatically uses the real Firebase backend once `src/firebase/config.js` is
filled in.

Working features:
- Project scaffolding, TypeScript build, Tailwind design system (black/white)
- Bilingual UI (Arabic default) with RTL/LTR document direction switching
- Navigation: sticky navbar with language toggle, desktop sidebar, footer
- 14 routed pages: Home, Sections, Lesson reader, Books, Book detail, Volume
  reader, Search, Favorites, Settings, Quiz, Achievements, Statistics, 404
- **Library of 29 books / 146 volumes** across 5 categories (Tawhid and Aqeedah,
  Tafsir, Hadith, Stories, Adab), all defined in `src/data/books.js`
  - Volume 1 of each book is bundled with the app (offline, PWA-precached, 8
    PDFs / ~36 MB); the remaining volumes download on demand and are stored in
    IndexedDB for offline reading, and can be deleted from the device
  - Remote volumes come from three sources, resolved at download time: a direct
    `downloadUrl`, a Supabase `storagePath`, or a member `path` inside a remote
    ZIP archive read over HTTP Range (`src/services/zipRangeReader.js`), which
    fetches only the volume the reader tapped
  - Books service supports full CRUD (mock + Firebase `books` collection)
  - Every book has a real cover image rendered from page 1 of its own PDF, so no
    book falls back to the placeholder
- Book detail page with rich metadata (author, muhaqqiq, translator, publisher,
  edition, year, language, category, madhab, description, cover)
- In-app PDF reader (pdf.js) with page navigation, zoom, jump-to-page and
  per-page reading progress; covers fall back to a styled placeholder rather
  than showing a broken image
- Search across lesson and section titles with highlighting, plus voice search
- Quiz player: progress, scoring, results, review mode with explanations, retake.
  Five questions per lesson are seeded for each of the four PDF lessons
- Notes (note/question per lesson), favourites, bookmarks, reading streaks,
  achievements and statistics, persisted per user
- Settings: language, font size, clear cache, demo-mode indicator and sign-out
- `ErrorBoundary` wraps the whole app, so a render crash shows a retry screen
  instead of a blank page
- **Installable PWA** (vite-plugin-pwa, Workbox): offline-first caching of the
  app shell, JS/CSS/worker assets and all bundled PDFs; Arabic manifest
  (تطبيق الفقه), standalone display, RTL, icons (192/512/maskable); runtime
  `CacheFirst` for other `/books/*.pdf` with `rangeRequests` enabled
  - Build output goes to `تطبيق الفقه/`; verified functional offline
- **Android APK** (`com.fiqh.app`) built from the same web bundle; native volume
  downloads go through `CapacitorHttp`, bypassing Google Drive's CORS
  restrictions
- `server/serve.mjs` — zero-dependency static server that also exposes the
  `/__drive-proxy` endpoint the web build needs for archive downloads
- Tooling: `npm run verify` runs typecheck, ESLint and `npm run
  verify:content`, which validates `books.js` against the files in `public/`
  (missing bundled PDFs or covers, unusable volumes, duplicate ids, unpaired
  ar/en fields, categories with no section)

Known gaps:
- Firebase and Supabase are placeholder configs, so the app always runs in demo
  mode and the real Firebase service layer is inert
- The web build needs a server-side download proxy to fetch remote volumes;
  see `docs/deployment.md`
- No test suite yet (Phase 6)
- Only eight of 146 volumes ship with the app; the rest are downloads
- No route-level code splitting beyond the PDF reader chunk

## Overview
This plan outlines the implementation steps for building the Islamic Fiqh learning application based on the approved design specification. The application will be built using React 18, Vite, TypeScript, Tailwind CSS, and Firebase with offline capabilities.

## Phase 0: Project Setup (Completed)
- [x] Project initialization with package.json
- [x] Vite configuration
- [x] Tailwind CSS setup
- [x] TypeScript configuration
- [x] Basic HTML template
- [x] Src directory structure
- [x] Main entry points (main.tsx, App.tsx)
- [x] Layout structure (MainLayout)
- [x] Base CSS with Tailwind imports

## Phase 1: Core Infrastructure and Firebase Setup
### 1.1 Firebase Configuration
- [ ] Create Firebase project and obtain config
- [ ] Implement Firebase initialization service
- [ ] Set up Firestore with offline persistence
- [ ] Configure Firebase Authentication (email/phone, Google as options)
- [ ] Create Firebase service wrapper with error handling

### 1.2 State Management
- [ ] Implement React Context for global state (auth, user progress, settings)
- [ ] Create useAuth hook for authentication state
- [ ] Create useUserProgress hook for learning progress
- [ ] Create useAppSettings hook for UI preferences (language, font size)

### 1.3 Internationalization (i18n)
- [x] Set up react-i18next with i18next-browser-languagedetector
- [x] Create translation files: src/i18n/ar.json and src/i18n/en.json
- [x] Implement language detection with Arabic as default
- [x] Create useTranslation wrapper hook
- [x] Implement direction handling (RTL/LTR) based on language

### 1.4 Offline Capabilities
- [x] Enable Firestore offline persistence
- [x] Implement service worker with Workbox for asset caching
- [ ] Create offline action queue for user interactions
- [ ] Add online/offline status indicator component
- [x] Implement local storage fallback for critical user data

## Phase 2: UI Components and Design System
### 2.1 Design System Implementation
- [ ] Configure Tailwind with black/white color scheme
- [ ] Set up custom fonts (Inter for English, Cairo/Amiri for Arabic)
- [ ] Create base component styles (buttons, inputs, cards, etc.)
- [ ] Implement responsive breakpoints (mobile/tablet/desktop)

### 2.2 Reusable UI Components
- [ ] Button component (primary, secondary, icon variants)
- [ ] Input/TextArea/Select components with proper labeling
- [ ] Card component with elevation and hover effects
- [ ] Badge component for labels and status indicators
- [ ] ProgressBar component for lesson/course progress
- [ ] LoadingSpinner and SkeletonLoader components
- [ ] LanguageToggle component with Arabic/English labels
- [ ] FontSizeControl component with preview
- [ ] Modal, Toast, and Dropdown components
- [ ] Custom SVG Icon components (Heroicons or custom)

### 2.3 Navigation Components
- [x] NavBar with logo, app name, and language toggle
- [x] Sidebar with section navigation (collapsible on mobile)
- [x] Footer with app version and links
- [ ] Breadcrumbs component for navigation hierarchy
- [ ] Pagination component for lists
- [x] SectionGrid component for displaying fiqh sections
- [x] LessonList component for displaying lessons

### 2.4 Content Components
- [ ] LessonReader component for displaying lesson content
- [ ] QuizPlayer component for taking quizzes
- [ ] SearchBar component with autocomplete
- [ ] FilterPanel for content filtering
- [ ] BookmarkToggle component for saving content
- [ ] CompleteToggle component for marking lessons complete
- [ ] ReadingProgressIndicator component

## Phase 3: Page Implementation
### 3.1 Home Page
- [x] Header with logo, app name, and language toggle
- [x] Hero section with welcome message and CTAs
- [x] Progress statistics display
- [x] Sections grid with clickable section cards
- [x] Recent activity carousel (last opened, saved lessons)
- [x] Prominent search bar

### 3.2 Sections/Browse Page
- [x] Two-column layout (section list | lesson preview) on desktop
- [x] Mobile accordion view for sections
- [x] Section cards with title, description, progress, icon
- [x] Lesson preview cards in selected section
- [x] Empty state when no sections exist
- [x] Loading and error states

### 3.3 Lesson Detail Page
- [x] Fixed header with back button, section title, lesson title
- [x] Reading area with max-width for comfortable line length
- [x] Content rendering with hierarchical blocks (heading, paragraph, note, list)
- [x] Font size controls in header (A- A A+)
- [x] Footer controls: Previous/Next lesson, Bookmark, Mark complete
- [x] Reading progress indicator at bottom
- [x] Loading and error states
- [ ] Offline access indicator

### 3.4 Search Page
- [x] Search bar with retained query
- [x] Results grouped by lessons and sections
- [x] Result cards with highlighted snippets
- [x] Section badges on lesson results
- [ ] Pagination or infinite scroll
- [x] Empty state with search suggestions
- [x] Loading and error states

### 3.5 Favorites Page
- [x] Tabs: Lessons | Topics | Questions
- [x] Grid/list view toggle for each tab
- [x] Favorite items with title, section, date saved, remove button
- [ ] Bulk remove option
- [x] Empty state guidance for each tab
- [x] Loading and error states

### 3.6 Settings Page
- [x] Language section: Arabic/English toggle with immediate effect
- [x] Display section: Font size slider with preview
- [x] About section: App version, description
- [x] Legal section: Links to Privacy Policy, Terms of Use
- [x] Data section: Clear cache, export/import options (future)
- [x] Loading and error states

### 3.7 Quiz/Test Page
- [x] Progress indicator: Question X of Y
- [x] Question card with question text and options (A/B/C/D)
- [x] Navigation: Previous, Next, Submit (on last question)
- [x] Results screen: Score percentage, breakdown, retake option
- [x] Review mode showing correct answers with explanations
- [x] Loading and error states

### 3.8 Error and Empty States
- [x] NotFoundPage for 404 routes
- [ ] Generic error page with retry option
- [x] Empty state components with guidance illustrations
- [x] Loading skeletons for content placeholders

## Phase 4: Features and Functionality
### 4.1 Authentication System
- [ ] Email/password registration and login
- [ ] Phone number authentication (optional)
- [ ] Google sign-in (optional)
- [ ] Auth protected routes
- [ ] User profile management
- [x] Sign out functionality

### 4.2 Learning Progress Tracking
- [x] Mark lessons as completed
- [x] Track completed lessons per user
- [x] Calculate overall progress percentage
- [ ] Track streaks (consecutive days of learning)
- [x] Last opened lesson tracking
- [x] Visual progress indicators in UI

### 4.3 Bookmarking/Favorites System
- [x] Save lessons to favorites
- [ ] Save specific topics or questions
- [x] Remove from favorites
- [x] View all favorites in dedicated page
- [x] Sync favorites when online/offline

### 4.4 Search Functionality
- [x] Search across lesson titles, section titles, and content
- [x] Real-time search as user types (debounced)
- [x] Highlight search matches in results
- [x] Filter results by section or type
- [ ] Search history (optional)
- [ ] Voice search capability (future enhancement)

### 4.5 Quiz and Assessment System
- [x] Create quizzes associated with lessons
- [x] Multiple choice questions with single correct answer
- [x] Immediate feedback after each question (optional)
- [x] Final score calculation
- [x] Review mode with explanations
- [x] Retake quiz functionality
- [ ] Quiz completion tracking

### 4.6 Content Management Structure
- [ ] Firestore data structure implementation:
  - sections collection
  - lessons collection
  - lesson_content subcollection/collection
  - quizzes collection
  - user_progress collection
  - app_settings collection
- [ ] Content validation and sanitization
- [ ] Versioning system for content updates
- [ ] Reference and source tracking for scholarly opinions

## Phase 5: Performance and Optimization
### 5.1 Code Optimization
- [ ] Implement code splitting with React.lazy() and Suspense
- [ ] Dynamic imports for route-based code splitting
- [ ] Memoize expensive computations with useMemo/useCallback
- [ ] Optimize re-renders with React.memo where appropriate
- [ ] Virtualize long lists (sections, lessons, search results)

### 5.2 Asset Optimization
- [ ] Image optimization and lazy loading
- [ ] Font optimization and fallback strategies
- [ ] SVG icon optimization
- [ ] Minimize third-party library usage
- [ ] Compress and optimize build output

### 5.3 Firebase Optimization
- [ ] Efficient queries with limits and pagination
- [ ] Indexing strategy for frequent queries
- [ ] Batch writes where appropriate
- [ ] Cache frequently accessed data
- [ ] Security rules implementation

### 5.4 Service Worker and Caching
- [ ] Precache essential assets (JS, CSS, fonts, images)
- [ ] Runtime caching strategies for API requests
- [ ] Cache busting for content updates
- [ ] Background sync for offline actions
- [ ] Update notifications for new service worker

## Phase 6: Testing and Quality Assurance
### 6.1 Unit Testing
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Test utility functions and helpers
- [ ] Test custom hooks
- [ ] Test Firebase service wrappers
- [ ] Test component rendering with React Testing Library

### 6.2 Integration Testing
- [ ] Test component interactions
- [ ] Test navigation and routing
- [ ] Test state management flows
- [ ] Test offline/online synchronization

### 6.3 End-to-End Testing
- [ ] Set up E2E testing framework (Cypress/Playwright)
- [ ] Test critical user flows:
  - User registration and login
  - Browsing sections and lessons
  - Reading lessons and tracking progress
  - Searching content
  - Adding to favorites
  - Taking quizzes
  - Changing settings
  - Offline functionality

### 6.4 Accessibility Testing
- [ ] Manual testing with screen readers
- [ ] Keyboard navigation testing
- [ ] Color contrast verification (WCAG AAA)
- [ ] ARIA label validation
- [ ] Focus management testing

### 6.5 Performance Testing
- [ ] Bundle size analysis
- [ ] Page load time measurement
- [ ] Runtime performance profiling
- [ ] Memory leak detection
- [ ] Offline functionality testing

## Phase 7: Deployment and Release
### 7.1 Build Optimization
- [ ] Production build configuration
- [ ] Source map generation for debugging
- [ ] Asset compression and optimization
- [ ] Bundle analyzer integration

### 7.2 Deployment Preparation
- [ ] Environment variable configuration
- [ ] Firebase hosting setup (or alternative hosting)
- [ ] SSL certificate configuration
- [ ] Custom domain setup (if applicable)
- [ ] Backup and recovery procedures

### 7.3 Release Process
- [ ] Versioning strategy (semantic versioning)
- [ ] Changelog maintenance
- [ ] Pre-release testing checklist
- [ ] Rollback procedure
- [ ] Monitoring and error tracking setup

## Phase 8: Documentation and Maintenance
### 8.1 Technical Documentation
- [ ] API documentation for Firebase services
- [ ] Component library documentation
- [ ] Development setup guide
- [ ] Contribution guidelines
- [ ] Architecture decision records

### 8.2 User Documentation
- [ ] User guide for application features
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] Accessibility statement

### 8.3 Maintenance Planning
- [ ] Regular dependency updates schedule
- [ ] Security audit process
- [ ] Performance monitoring setup
- [ ] Content update workflow
- [ ] Feedback collection mechanism

## Implementation Order
1. Phase 1: Core Infrastructure (Firebase, State, i18n, Offline)
2. Phase 2: UI Components (Design System, Reusable Components)
3. Phase 3: Pages (Home, Sections, Lesson Detail, Search, Favorites, Settings, Quiz)
4. Phase 4: Features (Auth, Progress, Favorites, Search, Quiz)
5. Phase 5: Performance Optimization
6. Phase 6: Testing
7. Phase 7: Deployment
8. Phase 8: Documentation

## Milestones
- **Milestone 1 (End of Phase 1)**: Basic app structure with Firebase connectivity and i18n working
- **Milestone 2 (End of Phase 2)**: Complete UI component library with design system
- **Milestone 3 (End of Phase 3)**: All pages implemented with basic functionality
- **Milestone 4 (End of Phase 4)**: Core features working (auth, progress, favorites, search)
- **Milestone 5 (End of Phase 5)**: Optimized performance with code splitting and caching
- **Milestone 6 (End of Phase 6)**: Comprehensive test suite passing
- **Milestone 7 (End of Phase 7)**: Deployed to production environment
- **Milestone 8 (End of Phase 8)**: Complete documentation and maintenance plan

## Risks and Mitigations
1. **Risk**: Firebase costs at scale
   **Mitigation**: Implement efficient queries, consider migrating to self-hosted solution later if needed

2. **Risk**: Complex offline synchronization
   **Mitigation**: Start with basic Firestore persistence, incrementally add advanced offline features

3. **Risk**: RTL/LTR layout complexity
   **Mitigation**: Use established i18n libraries, test thoroughly in both directions

4. **Risk**: Content accuracy and scholarly verification
   **Mitigation**: Focus on infrastructure first, content can be added by domain experts later

5. **Risk**: Performance issues on low-end devices
   **Mitigation**: Implement performance optimizations early, test on various device specifications

## Success Criteria
- Application loads in under 3 seconds on 3G connection
- Full functionality available offline after initial load
- Perfect black/white design system with no color deviations
- Seamless Arabic/English language switching
- WCAG AA accessibility compliance (aiming for AAA)
- All core features tested with >80% test coverage
- Deployed and accessible via HTTPS
- Ready for content addition by Islamic scholars

---

## Open issues

Tracked here so the stale checkboxes above are not the only record of what is
left. See `README.md` for how to run things and `docs/` for the guides.

| # | Issue | Where |
|---|---|---|
| 1 | No test suite (Phase 6). `scripts/verify-content.mjs` covers the library data only. | — |
| 2 | `src/firebase/config.js` and `src/supabase/config.js` are placeholders, so the real Firebase service layer and the Supabase volume source are inert. | `src/firebase/`, `src/supabase/` |
| 3 | The web build needs a `/__drive-proxy` endpoint for remote-volume downloads. `server/serve.mjs` provides one but no hosting is configured. | `docs/deployment.md` |
| 4 | ~~Covers exist for 15 of 29 books~~ **Resolved 2026-10-01** — all 29 books now have a cover rendered from page 1 of their own PDF. | `public/covers/` |
| 5 | ~~Four books have no author~~ **Resolved 2026-10-01** for three of them (`al-mukhtasar-fi-al-balagha` = د. عبد القادر حسين, `mukhtarat-al-shiir-al-jahili` = عبد المتعال الصعيدي, `mawsuat-al-qabail-al-arabiyya` = محمد سليمان الطيب). Still empty: `qisas-min-sahih-al-bukhari` — its title pages are decorative art that OCR cannot read, and the preface names only al-Bukhari as the source. Empty fields are hidden in the UI. | `src/data/books.js` |
| 6 | `mawsuat-al-qabail-al-arabiyya` skips volume 9 deliberately — documented in its description, not a bug. | `src/data/books.js` |
| 7 | Bundle is ~1.3 MB of JS; only the PDF reader is code-split. | `vite.config.ts` |
| 8 | `firebase` is a declared dependency but the app only ever runs its demo path until credentials exist. | `package.json` |
| 9 | Settings offers clear-cache only; export/import of user data is not implemented. | `src/pages/SettingsPage.jsx` |

---
*Implementation plan created following design approval. Status block and issue
list updated 2026-10-01.*
