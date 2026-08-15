import { NavBar } from '../components/Navigation/NavBar'
import { Footer } from '../components/Navigation/Footer'
import { Sidebar } from '../components/Navigation/Sidebar'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const MainLayout = () => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={`min-h-screen bg-white text-dark-gray ${isRTL ? 'rtl' : 'ltr'}`}>
      <NavBar />
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
