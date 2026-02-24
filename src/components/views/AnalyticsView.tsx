import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PieChart,
  BarChart3,
  Clock,
  CalendarDays,
  Monitor,
  Flame,
  TrendingUp,
  Tv,
} from 'lucide-react'
import { useMediaStore } from '../../store/useMediaStore'
import { GLASS_PANEL, GLASS_INNER } from '../../design/tokens'
import StatCard from '../ui/StatCard'
import { SkeletonStatCard } from '../ui/Skeleton'

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */
const DAYS = 182 // ~6 months
const WEEKS = Math.ceil(DAYS / 7)

/* ================================================================== */
/*  Watch Heatmap (GitHub-style)                                       */
/* ================================================================== */
function WatchHeatmap({ historyMap }: { historyMap: Record<string, number> }) {
  const { t } = useTranslation()
  const [tooltip, setTooltip] = useState<{
    date: string
    count: number
    x: number
    y: number
  } | null>(null)

  const { grid, total, monthLabels } = useMemo(() => {
    const today = new Date()
    const cells: { date: string; count: number; col: number; row: number }[] = []
    let sum = 0
    const months: { label: string; col: number }[] = []
    let lastMonth = -1

    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const count = historyMap[key] || 0
      sum += count
      const dayOfWeek = d.getDay()
      const col = DAYS - 1 - i
      const week = Math.floor(col / 7)
      cells.push({ date: key, count, col: week, row: dayOfWeek })

      // Track month boundaries
      const month = d.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        months.push({
          label: d.toLocaleString(undefined, { month: 'short' }),
          col: week,
        })
      }
    }
    return { grid: cells, total: sum, monthLabels: months }
  }, [historyMap])

  const maxCount = useMemo(
    () => Math.max(1, ...grid.map((c) => c.count)),
    [grid],
  )

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.03]'
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'bg-green-900/60'
    if (ratio <= 0.5) return 'bg-green-700/70'
    if (ratio <= 0.75) return 'bg-green-500/90'
    return 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]'
  }

  const hasData = total > 0

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-1">
        <Flame size={18} className="text-green-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.heatmap')}
        </h2>
      </div>
      <p className="text-[11px] text-white/30 mb-5 pl-[30px]">
        {t('analytics.heatmapSub')}
      </p>

      {!hasData ? (
        <div className={`${GLASS_INNER} rounded-2xl p-8 flex flex-col items-center gap-3`}>
          <CalendarDays size={28} className="text-white/15" />
          <p className="text-xs text-white/25 text-center max-w-xs">
            {t('analytics.noDataSub')}
          </p>
        </div>
      ) : (
        <>
          {/* Month labels */}
          <div className="overflow-x-auto hide-scrollbar pb-1">
            <div style={{ minWidth: `${WEEKS * 14}px` }}>
              <div
                className="grid mb-1"
                style={{
                  gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
                }}
              >
                {Array.from({ length: WEEKS }).map((_, w) => {
                  const match = monthLabels.find((m) => m.col === w)
                  return (
                    <span
                      key={w}
                      className="text-[9px] text-white/20 font-mono truncate"
                    >
                      {match?.label ?? ''}
                    </span>
                  )
                })}
              </div>

              {/* Grid */}
              <div
                className="grid gap-[3px]"
                style={{
                  gridTemplateRows: 'repeat(7, 1fr)',
                  gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
                  gridAutoFlow: 'column',
                }}
              >
                {grid.map((cell) => (
                  <div
                    key={cell.date}
                    className={`aspect-square min-w-[10px] rounded-[3px] ${getColor(cell.count)} transition-all duration-200 hover:scale-[1.8] hover:bg-white hover:z-10 cursor-crosshair`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({
                        date: cell.date,
                        count: cell.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y - 8 }}
            >
              <div className="bg-black/90 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white whitespace-nowrap backdrop-blur-md shadow-xl">
                <span className="font-mono">{tooltip.date}</span>
                <span className="mx-1.5 text-white/30">|</span>
                <span className="font-bold text-green-400">
                  {tooltip.count} streams
                </span>
              </div>
            </div>
          )}

          {/* Legend + stat */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <span>{t('analytics.less')}</span>
              <div className="flex gap-[3px]">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.03]" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-green-900/60" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-green-700/70" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-green-500/90" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-green-400" />
              </div>
              <span>{t('analytics.more')}</span>
            </div>
            <p className="text-xs text-white/40">
              <span className="font-bold text-white/70">{total.toLocaleString()}</span>{' '}
              {t('analytics.capturedStreams')}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Prime-Time Analysis (24h bar chart)                                */
/* ================================================================== */
function PrimeTimeChart({ peakHours }: { peakHours: number[] }) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)

  const maxVal = useMemo(() => Math.max(1, ...peakHours), [peakHours])
  const peakIdx = useMemo(
    () => peakHours.indexOf(maxVal),
    [peakHours, maxVal],
  )
  const hasData = peakHours.some((v) => v > 0)

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-1">
        <BarChart3 size={18} className="text-amber-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.primeTime')}
        </h2>
      </div>
      <p className="text-[11px] text-white/30 mb-5 pl-[30px]">
        {t('analytics.primeTimeSub')}
      </p>

      {!hasData ? (
        <div className={`${GLASS_INNER} rounded-2xl p-8 flex flex-col items-center gap-3`}>
          <Clock size={28} className="text-white/15" />
          <p className="text-xs text-white/25 text-center">
            {t('analytics.noDataSub')}
          </p>
        </div>
      ) : (
        <div className="flex items-end gap-[3px] h-44">
          {peakHours.map((val, i) => {
            const pct = (val / maxVal) * 100
            const isPeak = i === peakIdx && val > 0
            const isHov = hovered === i

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Hover count */}
                {isHov && val > 0 && (
                  <span className="absolute -top-6 text-[10px] font-mono font-bold text-white/90 bg-black/80 rounded-md px-2 py-0.5 border border-white/10 whitespace-nowrap z-20">
                    {val}
                  </span>
                )}

                <div
                  className={`w-full rounded-t transition-all duration-500 ease-out ${
                    isPeak
                      ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : isHov
                        ? 'bg-white/25'
                        : 'bg-white/[0.08]'
                  }`}
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    minHeight: '2px',
                  }}
                />

                {/* Hour label */}
                {i % 3 === 0 && (
                  <span className="text-[9px] text-white/20 mt-1.5 font-mono">
                    {String(i).padStart(2, '0')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Storage SVG Donut                                                  */
/* ================================================================== */
function StorageDonut() {
  const { t } = useTranslation()
  const counts = useMediaStore((s) => s.counts)

  const movies = counts?.MovieCount ?? 0
  const episodes = counts?.EpisodeCount ?? 0
  const songs = counts?.SongCount ?? 0
  const totalAll = movies + episodes + songs
  const total = Math.max(totalAll, 1)

  const segments = [
    { label: t('analytics.movies'), value: movies, color: '#60a5fa' },
    { label: t('analytics.episodes'), value: episodes, color: '#a78bfa' },
    { label: t('analytics.songs'), value: songs, color: '#f472b6' },
  ]

  const radius = 68
  const stroke = 16
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6 flex flex-col`}>
      <div className="flex items-center gap-3 mb-5">
        <Tv size={18} className="text-purple-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.storageMatrix')}
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={stroke}
            />
            {segments.map((seg) => {
              const ratio = seg.value / total
              const dash = ratio * circumference
              const currentOffset = offset
              offset += dash

              return (
                <circle
                  key={seg.label}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ opacity: ratio > 0 ? 1 : 0.1 }}
                />
              )
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tracking-tight text-white">
              {totalAll.toLocaleString()}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
              {t('analytics.videoItems')}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[11px] text-white/50">
                {seg.label}{' '}
                <span className="font-mono font-bold text-white/70">
                  {seg.value.toLocaleString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Client Ecosystem                                                   */
/* ================================================================== */
function ClientEcosystem({ clients }: { clients: Record<string, number> }) {
  const { t } = useTranslation()
  const sorted = useMemo(
    () => Object.entries(clients).sort(([, a], [, b]) => b - a),
    [clients],
  )
  const maxSessions = useMemo(
    () => Math.max(1, ...sorted.map(([, v]) => v)),
    [sorted],
  )

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <Monitor size={18} className="text-sky-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.clientEcosystem')}
        </h2>
      </div>

      {sorted.length === 0 ? (
        <div className={`${GLASS_INNER} rounded-2xl p-8 flex flex-col items-center gap-3`}>
          <Monitor size={28} className="text-white/15" />
          <p className="text-xs text-white/25 text-center">
            {t('analytics.noClients')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(([name, count]) => {
            const pct = (count / maxSessions) * 100
            return (
              <div key={name} className={`${GLASS_INNER} rounded-2xl p-4 relative overflow-hidden`}>
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500/[0.06] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                  <span className="text-[10px] font-mono font-bold text-sky-400 ml-3 shrink-0">
                    {count} {t('analytics.sessions')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  AnalyticsView                                                      */
/* ================================================================== */
export default function AnalyticsView() {
  const { t } = useTranslation()
  const { historyMap, peakHours, clients } = useMediaStore(
    (s) => s.analyticsData,
  )
  const counts = useMediaStore((s) => s.counts)

  /* ── Computed stats ── */
  const totalStreams = useMemo(
    () => Object.values(historyMap).reduce((a, b) => a + b, 0),
    [historyMap],
  )

  const peakHourIdx = useMemo(() => {
    const max = Math.max(...peakHours)
    return max > 0 ? peakHours.indexOf(max) : -1
  }, [peakHours])

  const bestWeek = useMemo(() => {
    const entries = Object.entries(historyMap)
    if (entries.length === 0) return null
    const weekMap: Record<string, number> = {}
    for (const [dateStr, count] of entries) {
      const d = new Date(dateStr)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d)
      monday.setDate(diff)
      const weekKey = monday.toISOString().split('T')[0]
      weekMap[weekKey] = (weekMap[weekKey] || 0) + count
    }
    let bestKey = ''
    let bestVal = 0
    for (const [k, v] of Object.entries(weekMap)) {
      if (v > bestVal) {
        bestVal = v
        bestKey = k
      }
    }
    return bestKey
      ? { date: new Date(bestKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: bestVal }
      : null
  }, [historyMap])

  const clientCount = Object.keys(clients).length
  const movieEpisodeCount = (counts?.MovieCount ?? 0) + (counts?.EpisodeCount ?? 0) + (counts?.SongCount ?? 0)

  const hasAnalytics = totalStreams > 0

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center gap-3">
        <PieChart size={22} className="text-white/60" />
        <h1 className="text-xl font-black tracking-tight text-white/90">
          {t('analytics.title')}
        </h1>
      </div>

      {/* ─── Stats Summary Row ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {counts === null ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              value={hasAnalytics ? totalStreams.toLocaleString() : '—'}
              label={t('analytics.totalStreams')}
              icon={TrendingUp}
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
            />
            <StatCard
              value={peakHourIdx >= 0 ? t('analytics.oclock', { hour: String(peakHourIdx).padStart(2, '0') }) : '—'}
              label={t('analytics.peakHour')}
              icon={Clock}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
            />
            <StatCard
              value={bestWeek ? bestWeek.count.toLocaleString() : '—'}
              label={bestWeek ? `${t('analytics.mostActiveWeek')} · ${bestWeek.date}` : t('analytics.mostActiveWeek')}
              icon={CalendarDays}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10"
            />
            <StatCard
              value={clientCount > 0 ? clientCount : '—'}
              label={t('analytics.activeClients')}
              icon={Monitor}
              iconColor="text-sky-400"
              iconBg="bg-sky-500/10"
            />
          </>
        )}
      </section>

      {/* ─── Watch Heatmap ─── */}
      <WatchHeatmap historyMap={historyMap} />

      {/* ─── Prime-Time + Storage Donut ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <PrimeTimeChart peakHours={peakHours} />
        <StorageDonut />
      </div>

      {/* ─── Client Ecosystem ─── */}
      <ClientEcosystem clients={clients} />

      {/* ─── Global empty state hint ─── */}
      {!hasAnalytics && movieEpisodeCount === 0 && (
        <div className={`${GLASS_PANEL} rounded-3xl p-10 flex flex-col items-center gap-4`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${GLASS_INNER}`}>
            <PieChart size={32} className="text-white/20" />
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold text-white/50">{t('analytics.noDataTitle')}</h2>
            <p className="text-sm text-white/30 max-w-md">{t('analytics.noDataSub')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
