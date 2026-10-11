import { NavBar } from '../components/Navigation/NavBar'
import { BottomNav } from '../components/Navigation/BottomNav'
import { Footer } from '../components/Navigation/Footer'
import { Sidebar } from '../components/Navigation/Sidebar'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const MainLayout = () => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={`flex min-h-screen flex-col bg-paper text-ink-body ${isRTL ? 'rtl' : 'ltr'}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        {isRTL ? 'تخطي إلى المحتوى' : 'Skip to content'}
      </a>
      <NavBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar />
        <main id="main-content" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
      <BottomNav />
      {/* The fixed tab bar floats over the page; on mobile reserve its height
          so the footer is never hidden behind it. */}
      <div className="h-14 lg:hidden" aria-hidden="true" />
    </div>
  )
}
