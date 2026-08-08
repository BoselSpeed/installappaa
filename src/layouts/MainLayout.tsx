import { NavBar } from '../components/Navigation/NavBar'
import { Footer } from '../components/Navigation/Footer'
import { Sidebar } from '../components/Navigation/Sidebar'
import { LanguageToggle } from '../components/UI/LanguageToggle'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const MainLayout = () => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={`min-h-screen bg-white text-dark-gray ${isRTL ? 'rtl' : 'ltr'}`}>
      <LanguageToggle />
      <NavBar />
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <Sidebar />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  )
}
