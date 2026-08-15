# Islamic Fiqh Learning Application - Design Specification

**Date:** 2026-08-08  
**Topic:** Islamic Fiqh Learning Application with Offline Capabilities  

## 1. Project Overview
A professional, modern application for learning Islamic Fiqh (jurisprudence) with a clean black and white design system, bilingual support (Arabic/English), offline functionality, and structured content organization.

## 2. Technology Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (black/white design system)
- **State Management:** React Context API + useReducer
- **Backend/Storage:** Firebase Firestore (with offline persistence) + Firebase Auth
- **Build Tool:** Vite
- **Icons:** Heroicons
- **Internationalization:** react-i18next
- **Offline/Caching:** Service Worker (Workbox) + Firestore offline persistence

## 3. Architecture Overview
- Single Page Application (SPA) with client-side routing (React Router v6)
- Modular component structure organized by feature/type
- Data layer separation with isolated Firebase services
- Offline-first approach with automatic synchronization
- Language detection with Arabic as default

## 4. Offline Strategy
1. Firestore offline persistence for automatic sync when online
2. Service worker for caching static assets
3. Local storage fallback for user progress/preferences
4. Action queue for offline interactions that sync when online
5. Online/offline status indicators in UI

## 5. UI/UX Design System
**Color Palette:** 
- Primary: #000000 (Black), #FFFFFF (White)
- Neutrals: #F8F9FA (Off-white), #212529 (Dark Gray)

**Typography:**
- Arabic: Cairo or Amiri font
- English: Inter or Helvetica Neue
- Hierarchical scaling from H1 (2.5rem) to body (1rem)

**Spacing & Layout:**
- 4px grid system
- 8px border radius for soft corners
- Subtle shadows for elevation

## 6. Key Pages
1. **Home Page:** Logo, welcome message, CTA buttons, progress stats, sections grid, recent activity
2. **Browse Sections:** Two-column layout (section list/lesson preview), mobile accordion
3. **Lesson Detail:** Fixed header, reading area, content with headings/paragraphs, footer controls
4. **Search Results:** Search bar with grouped results (lessons/sections), highlighted snippets
5. **Favorites:** Tabs for lessons/topics/questions with grid/list toggle
6. **Settings:** Language, display, about, legal sections with immediate language toggle
7. **Quiz/Test:** Progress indicator, question cards, navigation, results screen with review mode

## 7. Component Hierarchy
```
App
├── Layouts (MainLayout, EmptyLayout, QuizLayout)
├── Components
│   ├── UI (Button, Input, Card, Badge, etc.)
│   ├── Navigation (NavBar, SideBar, Breadcrumbs, SectionGrid)
│   ├── Content (LessonReader, QuizPlayer, SearchBar, BookmarkToggle)
│   └── Icons (custom SVG)
├── Pages (route components)
├── Hooks (useAuth, useFirestore, usei18n, useOffline)
├── Services (Firebase wrappers)
├── Utils (formatters, validators, constants)
├── Types (TypeScript interfaces)
�└── i18n (ar.json, en.json translation files)
```

## 8. Responsiveness & Accessibility
**Breakpoints:** Mobile (<640px), Tablet (640px-1024px), Desktop (>1024px)
**Accessibility Features:**
- Semantic HTML elements
- ARIA labels and keyboard navigation
- WCAG AAA contrast compliance (black/white)
- Font scaling respect and screen reader support
- Focus rings and live regions for updates

## 9. Data Structure (Firebase Firestore)
**Collections:**
- `sections`: {id, title_ar, title_en, description_ar, description_en, icon, order, isActive}
- `lessons`: {id, sectionId, title_ar, title_en, level, order, isActive}
- `lesson_content`: {lessonId, blocks: [{type: 'heading|paragraph|note|list', content_ar, content_en}]}
- `quizzes`: {id, lessonId, title_ar, title_en, questions: [{question_ar, question_en, options_ar, options_en, correctAnswer}]}
- `user_progress`: {userId, completedLessons[], bookmarkedLessons[], lastOpened, streaks}
- `app_settings`: {userId, language, fontSize, theme}

## 10. User Flow
1. App launches in user's browser language or defaults to Arabic
2. Home page shows progress, quick start, section browsing
3. User navigates to sections → lessons → reads content
4. Interactive features: bookmark, mark complete, font size adjustment
5. Search functionality across all content
6. Favorites system for saving important items
7. Quiz system linked to lessons for assessment
8. Settings for language, display preferences, legal information

## 11. Content Management Approach
- No hardcoded Islamic content in application code
- Separate data layer allowing administrators to add/modify:
  - Sections (fiqh topics like taharah, salah, zakat, etc.)
  - Lessons with hierarchical content blocks
  - Quizzes with multiple choice questions
- Reference system for scholarly opinions and sources built into content structure
- Easy content import/export via Firebase or admin interface (to be built later)

## 12. Performance Optimizations
- Code splitting via React.lazy() and dynamic imports
- Image optimization and lazy loading
- Memoization of expensive computations
- Efficient Firebase queries with limits and pagination
- Service worker precaching and runtime caching
- Minimal initial bundle size

---
*Design approved following brainstorming skill process. Next step: spec self-review.*