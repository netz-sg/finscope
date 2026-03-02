import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Film, Music, Users, LogIn, LogOut, Database,
  AlertCircle, Info, RefreshCw, ChevronDown,
} from 'lucide-react'
import { JellyfinAPI } from '../../api/jellyfin'
import { useAppStore } from '../../store/useAppStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'

interface ActivityEntry {
  Id: number
  Name: string
  ShortOverview?: string
  Overview?: string
  Type: string
  UserId?: string
  UserName?: string
  Severity: 'Information' | 'Warning' | 'Error'
  Date: string
  ItemId?: string
}

function entryIcon(type: string, severity: string) {
  if (severity === 'Error') return <AlertCircle size={14} className="text-red-400" />
  if (type.toLowerCase().includes('video') || type.toLowerCase().includes('playback')) {
    return <Film size={14} className="text-blue-400" />
  }
  if (type.toLowerCase().includes('audio') || type.toLowerCase().includes('music')) {
    return <Music size={14} className="text-pink-400" />
  }
  if (type.toLowerCase().includes('login') || type.toLowerCase().includes('loggedin')) {
    return <LogIn size={14} className="text-emerald-400" />
  }
  if (type.toLowerCase().includes('logout') || type.toLowerCase().includes('loggedout')) {
    return <LogOut size={14} className="text-white/40" />
  }
  if (type.toLowerCase().includes('user')) {
    return <Users size={14} className="text-purple-400" />
  }
  if (type.toLowerCase().includes('library') || type.toLowerCase().includes('item')) {
    return <Database size={14} className="text-amber-400" />
  }
  return <Info size={14} className="text-white/30" />
}

function entryDotColor(severity: string) {
  if (severity === 'Error') return 'bg-red-400'
  if (severity === 'Warning') return 'bg-amber-400'
  return 'bg-white/20'
}

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return t('time.justNow')
  if (mins < 60) return t('time.ago', { count: mins, unit: t(mins === 1 ? 'time.units.minute_one' : 'time.units.minute_other') })
  if (hours < 24) return t('time.ago', { count: hours, unit: t(hours === 1 ? 'time.units.hour_one' : 'time.units.hour_other') })
  return t('time.ago', { count: days, unit: t(days === 1 ? 'time.units.day_one' : 'time.units.day_other') })
}

function groupByDay(entries: ActivityEntry[]): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {}
  for (const entry of entries) {
    const day = new Date(entry.Date).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(entry)
  }
  return groups
}

const PAGE_SIZE = 50

export default function ActivityView() {
  const { t } = useTranslation()
  const { isDemoMode } = useAppStore()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (startIndex = 0, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    const data: ActivityEntry[] = await JellyfinAPI.getActivityLog(PAGE_SIZE, startIndex)
    if (append) {
      setEntries((prev) => [...prev, ...data])
    } else {
      setEntries(data)
    }
    setHasMore(data.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    if (!isDemoMode) load(0)
    else setLoading(false)
  }, [isDemoMode, load])

  const loadMore = () => load(entries.length, true)

  const grouped = groupByDay(entries)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('activity.title')}</h1>
          <p className="text-sm text-white/40 mt-1">{t('activity.subtitle')}</p>
        </div>
        <button
          onClick={() => load(0)}
          className={`${GLASS_INNER} rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white ${TRANSITION}`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('activity.refresh')}
        </button>
      </div>

      {isDemoMode && (
        <div className={`${GLASS_PANEL} rounded-3xl p-8 text-center`}>
          <p className="text-white/40 text-sm">{t('activity.demoUnavailable')}</p>
        </div>
      )}

      {!isDemoMode && loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${GLASS_INNER} rounded-2xl h-16 animate-pulse`} />
          ))}
        </div>
      )}

      {!isDemoMode && !loading && entries.length === 0 && (
        <div className={`${GLASS_PANEL} rounded-3xl p-12 text-center`}>
          <p className="text-white/30 text-sm">{t('activity.empty')}</p>
        </div>
      )}

      {!isDemoMode && !loading && Object.entries(grouped).map(([day, dayEntries]) => (
        <div key={day} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1 mb-3">
            {day}
          </p>

          <div className={`${GLASS_PANEL} rounded-3xl overflow-hidden`}>
            {dayEntries.map((entry, idx) => (
              <div
                key={entry.Id}
                className={`flex items-start gap-4 px-5 py-4 ${TRANSITION} hover:bg-white/[0.03] ${
                  idx < dayEntries.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${entryDotColor(entry.Severity)}`} />
                </div>

                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  {entryIcon(entry.Type, entry.Severity)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white/90 leading-tight">
                      {entry.ShortOverview || entry.Name}
                    </p>
                    {entry.UserName && (
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                        {entry.UserName}
                      </span>
                    )}
                  </div>
                  {entry.Overview && entry.Overview !== entry.ShortOverview && (
                    <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{entry.Overview}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-white/25 tabular-nums whitespace-nowrap">
                    {formatRelativeTime(entry.Date, t)}
                  </span>
                  {entry.Severity !== 'Information' && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      entry.Severity === 'Error'
                        ? 'bg-red-400/15 text-red-400'
                        : 'bg-amber-400/15 text-amber-400'
                    }`}>
                      {entry.Severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isDemoMode && !loading && hasMore && (
        <div className="flex justify-center pb-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`${GLASS_INNER} rounded-2xl px-6 py-3 flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white ${TRANSITION} disabled:opacity-40`}
          >
            <ChevronDown size={16} className={loadingMore ? 'animate-bounce' : ''} />
            {t('activity.loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
