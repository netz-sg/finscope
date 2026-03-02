import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useMediaStore } from '../../store/useMediaStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import NotificationPanel from '../ui/NotificationPanel'

export default function Header() {
  const { t } = useTranslation()
  const { isDemoMode, serverInfo } = useAppStore()
  const { sessions, counts } = useMediaStore()
  const { unreadCount, togglePanel } = useNotificationStore()

  return (
    <header className="absolute top-0 left-0 w-full z-50 p-4 sm:p-6 md:p-8 flex justify-between items-start pointer-events-none">
      <div className="pointer-events-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase mb-1 flex items-center gap-2 sm:gap-3 drop-shadow-md">
          {t('app.name')}
          {isDemoMode && (
            <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
              {t('app.sandbox')}
            </span>
          )}
        </h1>
        <p className="text-white/60 font-mono text-xs uppercase tracking-widest flex items-center drop-shadow-md">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_#22c55e]" />
          {serverInfo?.ServerName} / {serverInfo?.OperatingSystem}
        </p>
      </div>
      <div className="pointer-events-auto flex items-start gap-4 sm:gap-6 md:gap-8 text-right drop-shadow-md">
        <div>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
            {t('header.liveStreams')}
          </p>
          <p className="text-2xl font-black">{sessions.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
            {t('header.mediaTotal')}
          </p>
          <p className="text-2xl font-black">
            {counts
              ? (counts.MovieCount + counts.EpisodeCount + counts.SongCount).toLocaleString()
              : '...'}
          </p>
        </div>
        <button
          onClick={togglePanel}
          className="relative p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-300 mt-0.5"
        >
          <Bell size={18} className="text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      <NotificationPanel />
    </header>
  )
}
