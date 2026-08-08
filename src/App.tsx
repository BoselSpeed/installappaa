import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SectionsPage } from './pages/SectionsPage'
import { LessonDetailPage } from './pages/LessonDetailPage'
import { SearchPage } from './pages/SearchPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
import { QuizPage } from './pages/QuizPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AppProviders } from './components/AppProviders'

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/sections/:sectionId" element={<SectionsPage />} />
        <Route path="/section/:sectionId/lesson/:lessonId" element={<LessonDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppProviders>
  )
}

export default App
