import { useState, useMemo } from 'react'
import { Radio, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMediaStore } from '../../store/useMediaStore'
import { GLASS_PANEL, GLASS_INNER } from '../../design/tokens'
import SessionCard from '../ui/SessionCard'

/* ------------------------------------------------------------------ */
/*  Filter Pill                                                        */
/* ------------------------------------------------------------------ */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition-all duration-300 ${
        active
          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.06)]'
          : `${GLASS_INNER} border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10`
      }`}
    >
      {label}
    </button>
  )
}

/* ================================================================== */
/*  RadarView                                                          */
/* ================================================================== */
export default function RadarView() {
  const { t } = useTranslation()
  const { sessions } = useMediaStore()

  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  /* Derive unique filter options from sessions */
  const userNames = useMemo(
    () => [...new Set(sessions.map((s) => s.UserName))].sort(),
    [sessions],
  )
  const mediaTypes = useMemo(
    () => [...new Set(sessions.map((s) => s.NowPlayingItem.Type))].sort(),
    [sessions],
  )

  /* Apply filters */
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterUser !== 'all' && s.UserName !== filterUser) return false
      if (filterMethod !== 'all') {
        const isTranscode = s.PlayState.PlayMethod === 'Transcode'
        if (filterMethod === 'transcode' && !isTranscode) return false
        if (filterMethod === 'direct' && isTranscode) return false
      }
      if (filterType !== 'all' && s.NowPlayingItem.Type !== filterType) return false
      return true
    })
  }, [sessions, filterUser, filterMethod, filterType])

  const hasActiveFilter = filterUser !== 'all' || filterMethod !== 'all' || filterType !== 'all'

  const resetFilters = () => {
    setFilterUser('all')
    setFilterMethod('all')
    setFilterType('all')
  }

  /* Empty state */
  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-32">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${GLASS_PANEL}`}>
          <Radio size={36} className="text-white/30" />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-white/50">{t('radar.idle')}</h2>
          <p className="text-sm text-white/30 max-w-xs">{t('radar.noStreams')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-white/80">
          {t('home.currentTransmissions')}
        </h2>
        <span className="text-xs font-mono text-white/30">
          {hasActiveFilter
            ? t('radar.filteredCount', { shown: filtered.length, total: sessions.length })
            : t('time.streams', { count: sessions.length })}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* User filter */}
        <FilterPill label={t('radar.allUsers')} active={filterUser === 'all'} onClick={() => setFilterUser('all')} />
        {userNames.map((name) => (
          <FilterPill key={name} label={name} active={filterUser === name} onClick={() => setFilterUser(name)} />
        ))}

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Method filter */}
        <FilterPill label={t('radar.allMethods')} active={filterMethod === 'all'} onClick={() => setFilterMethod('all')} />
        <FilterPill label={t('radar.transcoding')} active={filterMethod === 'transcode'} onClick={() => setFilterMethod('transcode')} />
        <FilterPill label={t('radar.directPlay')} active={filterMethod === 'direct'} onClick={() => setFilterMethod('direct')} />

        {mediaTypes.length > 1 && (
          <>
            <span className="w-px h-5 bg-white/10 mx-1" />

            {/* Type filter */}
            <FilterPill label={t('radar.allTypes')} active={filterType === 'all'} onClick={() => setFilterType('all')} />
            {mediaTypes.map((type) => (
              <FilterPill key={type} label={type} active={filterType === type} onClick={() => setFilterType(type)} />
            ))}
          </>
        )}

        {/* Reset button */}
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            {t('radar.resetFilter')}
          </button>
        )}
      </div>

      {/* Session grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="text-sm text-white/30">{t('radar.noResults')}</p>
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
          >
            {t('radar.resetFilter')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-10 pt-4">
          {filtered.map((session) => (
            <SessionCard key={session.Id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
