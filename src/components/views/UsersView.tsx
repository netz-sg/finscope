import { useMemo } from 'react'
import { Shield, Film, Tv, Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useMediaStore } from '../../store/useMediaStore'
import { useUIStore } from '../../store/useUIStore'
import { GLASS_PANEL, GLASS_PANEL_HOVER, GLASS_INNER } from '../../design/tokens'
import { ticksToSeconds, timeAgo } from '../../utils/time'
import { getMediaTypeConfig } from '../../utils/mediaTypes'
import { JellyfinAPI } from '../../api/jellyfin'
import CoverArt from '../ui/CoverArt'
import UserAvatar from '../ui/UserAvatar'
import ProgressBar from '../ui/ProgressBar'
import type { JellyfinUser, Session } from '../../types/jellyfin'

const RECENT_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

function getHistoryIcon(type: string | undefined) {
  switch (type) {
    case 'Audio':
      return Music
    case 'Episode':
    case 'Series':
      return Tv
    default:
      return Film
  }
}

interface UserCardProps {
  user: JellyfinUser
  liveSession: Session | undefined
}

function UserCard({ user, liveSession }: UserCardProps) {
  const { t } = useTranslation()
  const { config, isDemoMode } = useAppStore()
  const { setSelectedItem } = useUIStore()

  const isLive = !!liveSession
  const isOnline = useMemo(() => {
    if (!user.LastActivityDate) return false
    return Date.now() - new Date(user.LastActivityDate).getTime() < RECENT_THRESHOLD_MS
  }, [user.LastActivityDate])

  const statusColor = isLive ? 'bg-emerald-400' : isOnline ? 'bg-sky-400' : 'bg-white/20'
  const statusRing = isLive
    ? 'ring-emerald-400/40'
    : isOnline
      ? 'ring-sky-400/30'
      : 'ring-transparent'

  const avatarUrl = isDemoMode
    ? undefined
    : JellyfinAPI.getUserImageUrl(config.url, user.Id)

  const historyItems = (user.RecentHistory || []).slice(0, 3)

  return (
    <div
      className={`relative rounded-3xl overflow-hidden ${GLASS_PANEL} ${GLASS_PANEL_HOVER} ${
        isLive ? 'ring-1 ring-emerald-400/20' : ''
      }`}
    >
      {/* Live glow effect */}
      {isLive && (
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      )}

      <div className="relative z-10 p-5">
        {/* Header: avatar + info */}
        <div className="flex items-start gap-4">
          {/* Avatar with status dot */}
          <div className="relative flex-shrink-0">
            <UserAvatar url={avatarUrl} name={user.Name} className="w-16 h-16 text-xl" />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0a0a0f] ${statusColor} ring-4 ${statusRing}`}
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight truncate">{user.Name}</h3>
              {user.Policy?.IsAdministrator && (
                <Shield size={14} className="text-amber-400 flex-shrink-0" />
              )}
            </div>

            {/* Status text */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {isLive ? (
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {t('users.streaming')}
                </span>
              ) : isOnline ? (
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                  {t('users.online')}
                </span>
              ) : (
                <span className="text-[10px] text-white/40 font-mono">
                  {timeAgo(user.LastActivityDate, t)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className={`grid grid-cols-2 gap-2.5 mt-4 rounded-2xl p-3 ${GLASS_INNER}`}>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tight">
              {user.PlayCount?.toLocaleString() ?? 0}
            </p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">
              {t('users.playedMedia')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tight">
              {historyItems.length}
            </p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">
              {t('users.recentlyActive')}
            </p>
          </div>
        </div>

        {/* Live mini player */}
        {isLive && liveSession && (
          <div
            onClick={() => setSelectedItem(liveSession.NowPlayingItem)}
            className={`mt-3 rounded-2xl p-3 cursor-pointer ${GLASS_INNER} ring-1 ring-emerald-400/10 hover:ring-emerald-400/25 transition-all`}
          >
            <div className="flex items-center gap-3">
              {/* Mini cover */}
              <CoverArt
                url={
                  isDemoMode
                    ? undefined
                    : JellyfinAPI.getItemImageUrl(config.url, liveSession.NowPlayingItem.Id)
                }
                title={liveSession.NowPlayingItem.Name}
                isDemo={isDemoMode}
                type={liveSession.NowPlayingItem.Type}
                className="w-10 h-14 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    LIVE
                  </span>
                </div>
                <p className="text-sm font-bold truncate">{liveSession.NowPlayingItem.Name}</p>
                {liveSession.NowPlayingItem.SeriesName && (
                  <p className="text-[10px] text-white/40 truncate">
                    {liveSession.NowPlayingItem.SeriesName}
                  </p>
                )}
                <ProgressBar
                  progress={
                    liveSession.NowPlayingItem.RunTimeTicks
                      ? (ticksToSeconds(liveSession.PlayState.PositionTicks) /
                          ticksToSeconds(liveSession.NowPlayingItem.RunTimeTicks)) *
                        100
                      : 0
                  }
                  type={liveSession.NowPlayingItem.Type}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* History section */}
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
            {t('users.history')}
          </p>

          {historyItems.length === 0 ? (
            <p className="text-xs text-white/20 italic">{t('users.noHistory')}</p>
          ) : (
            <div className="space-y-1.5">
              {historyItems.map((item, i) => {
                const Icon = getHistoryIcon(item.Type)
                const cfg = getMediaTypeConfig(item.Type)
                return (
                  <div
                    key={`${item.Id}-${i}`}
                    onClick={() => setSelectedItem(item)}
                    className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg}`}>
                      <Icon size={12} className={cfg.color} />
                    </div>
                    <span className="text-xs text-white/60 truncate flex-1">{item.Name}</span>
                    {item.SeriesName && (
                      <span className="text-[10px] text-white/25 truncate max-w-[100px]">
                        {item.SeriesName}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UsersView() {
  const { t } = useTranslation()
  const { sessions, users } = useMediaStore()

  /* Build a map of userId -> session for live detection */
  const liveSessionMap = useMemo(() => {
    const map = new Map<string, Session>()
    sessions.forEach((s) => {
      if (s.NowPlayingItem) map.set(s.UserId, s)
    })
    return map
  }, [sessions])

  /* Sort users: live first, then by LastActivityDate descending */
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aLive = liveSessionMap.has(a.Id) ? 1 : 0
      const bLive = liveSessionMap.has(b.Id) ? 1 : 0
      if (aLive !== bLive) return bLive - aLive

      const aDate = a.LastActivityDate ? new Date(a.LastActivityDate).getTime() : 0
      const bDate = b.LastActivityDate ? new Date(b.LastActivityDate).getTime() : 0
      return bDate - aDate
    })
  }, [users, liveSessionMap])

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold tracking-tight text-white/80">
          {t('nav.users')}
        </h2>
        <span className="text-xs font-mono text-white/30">
          {users.length}
        </span>
        {sessions.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 ml-auto">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
            </div>
            {t('time.streams', { count: sessions.length })}
          </span>
        )}
      </div>

      {/* User grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedUsers.map((user) => (
          <UserCard
            key={user.Id}
            user={user}
            liveSession={liveSessionMap.get(user.Id)}
          />
        ))}
      </div>
    </div>
  )
}
