import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useJellyfinPolling } from './hooks/useJellyfinPolling'
import { useTickTimer } from './hooks/useTickTimer'
import { useHeroRotation } from './hooks/useHeroRotation'

import Background from './components/layout/Background'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import LoadingScreen from './components/views/LoadingScreen'
import OnboardingScreen from './components/views/OnboardingScreen'
import LoginScreen from './components/views/LoginScreen'
import HomeView from './components/views/HomeView'
import RadarView from './components/views/RadarView'
import AnalyticsView from './components/views/AnalyticsView'
import UsersView from './components/views/UsersView'
import LibraryView from './components/views/LibraryView'
import PulseView from './components/views/PulseView'
import SettingsView from './components/views/SettingsView'
import ArtistDetailView from './components/views/ArtistDetailView'
import AlbumDetailView from './components/views/AlbumDetailView'
import ItemDetailOverlay from './components/modals/ItemDetailOverlay'
import NewsDetailOverlay from './components/modals/NewsDetailOverlay'
import ToastContainer from './components/ui/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'

function Dashboard() {
  const { isDemoMode } = useAppStore()

  useJellyfinPolling()
  useTickTimer()
  useHeroRotation()

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans flex flex-col overflow-hidden relative selection:bg-white selection:text-black">
      <ItemDetailOverlay />
      <NewsDetailOverlay />

      <Background isDemo={isDemoMode} />

      <main className="relative z-10 flex-1 h-screen overflow-y-auto hide-scrollbar pb-32">
        <Header />

        <div className="w-full">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/radar" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><RadarView /></div>} />
            <Route path="/analytics" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><AnalyticsView /></div>} />
            <Route path="/users" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><UsersView /></div>} />
            <Route path="/library" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><LibraryView /></div>} />
            <Route path="/pulse" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><PulseView /></div>} />
            <Route path="/settings" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><SettingsView /></div>} />
            <Route path="/artist/:id" element={<ArtistDetailView />} />
            <Route path="/album/:id" element={<div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 pt-28 sm:pt-32"><AlbumDetailView /></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

function AppRouter() {
  const { phase, initialize } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (phase === 'loading') return <LoadingScreen />
  if (phase === 'onboarding') return <OnboardingScreen />
  if (phase === 'login') return <LoginScreen />

  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <ToastContainer />
    </BrowserRouter>
  )
}
