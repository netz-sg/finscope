import {
  Home,
  LayoutGrid,
  PieChart,
  Users,
  Database,
  Zap,
  Settings,
  Power,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

const NAV_ITEMS: { path: string; icon: typeof Home; labelKey: string }[] = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/radar', icon: LayoutGrid, labelKey: 'nav.radar' },
  { path: '/analytics', icon: PieChart, labelKey: 'nav.analytics' },
  { path: '/users', icon: Users, labelKey: 'nav.users' },
  { path: '/library', icon: Database, labelKey: 'nav.library' },
  { path: '/pulse', icon: Zap, labelKey: 'nav.pulse' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAppStore((s) => s.logout)

  return (
    <div className="fixed bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]">
      <nav className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 bg-white/[0.05] backdrop-blur-[50px] border border-white/[0.15] border-t-white/[0.25] rounded-full p-1.5 sm:p-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
        {NAV_ITEMS.map((nav) => {
          const isActive = location.pathname === nav.path
          return (
            <button
              key={nav.path}
              onClick={() => navigate(nav.path)}
              className={`relative flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-medium text-xs sm:text-sm ${
                isActive
                  ? 'bg-white/20 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10'
                  : 'text-white/50 hover:text-white hover:bg-white/10 hover:scale-105'
              }`}
            >
              <nav.icon size={18} className={isActive ? 'drop-shadow-md' : ''} />
              <span className={isActive ? 'hidden sm:block' : 'hidden lg:block'}>
                {t(nav.labelKey)}
              </span>
            </button>
          )
        })}
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />
        <button
          onClick={() => logout()}
          className="p-2.5 rounded-full text-white/30 hover:text-red-400 hover:bg-red-400/20 hover:shadow-[inset_0_1px_1px_rgba(248,113,113,0.3)] transition-all mr-1"
        >
          <Power size={18} />
        </button>
      </nav>
    </div>
  )
}
