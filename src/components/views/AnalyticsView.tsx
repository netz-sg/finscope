import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  Trophy,
  Users,
  CheckCircle,
} from 'lucide-react'
import { useMediaStore } from '../../store/useMediaStore'
import { useAppStore } from '../../store/useAppStore'
import { JellyfinAPI } from '../../api/jellyfin'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'
import StatCard from '../ui/StatCard'
import UserAvatar from '../ui/UserAvatar'
import { SkeletonStatCard } from '../ui/Skeleton'
import type { TrendDataPoint, PopularItem, UserComparisonEntry, CompletionRateEntry } from '../../types/app'

const DAYS = 182

function WatchHeatmap({ historyMap }: { historyMap: Record<string, number> }) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(800)
  const [tooltip, setTooltip] = useState<{
    date: string
    count: number
    mx: number
    my: number
  } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerW(el.clientWidth || 800)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setContainerW(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { grid, total, monthLabels, totalWeeks } = useMemo(() => {
    const today = new Date()
    const cells: { date: string; count: number; col: number; row: number }[] = []
    let sum = 0
    const months: { label: string; col: number }[] = []
    let lastMonth = -1

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (DAYS - 1))
    const startDow = startDate.getDay()

    for (let i = 0; i < startDow; i++) {
      cells.push({ date: '', count: -1, col: 0, row: i })
    }

    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const count = historyMap[key] || 0
      sum += count
      const dayOfWeek = d.getDay()
      const seqIdx = DAYS - 1 - i
      const week = Math.floor((seqIdx + startDow) / 7)
      cells.push({ date: key, count, col: week, row: dayOfWeek })

      const month = d.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        months.push({
          label: d.toLocaleString(undefined, { month: 'short' }),
          col: week,
        })
      }
    }

    const lastWeek = cells.length > 0 ? Math.max(...cells.map((c) => c.col)) : 0
    const todayDow = today.getDay()
    for (let i = todayDow + 1; i < 7; i++) {
      cells.push({ date: '', count: -1, col: lastWeek, row: i })
    }

    return { grid: cells, total: sum, monthLabels: months, totalWeeks: lastWeek + 1 }
  }, [historyMap])

  const maxCount = useMemo(
    () => Math.max(1, ...grid.filter((c) => c.count >= 0).map((c) => c.count)),
    [grid],
  )

  const getColor = useCallback((count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.025)'
    const ratio = count / maxCount
    if (ratio <= 0.25) return '#0f3d1e'
    if (ratio <= 0.5) return '#166534'
    if (ratio <= 0.75) return '#22c55e'
    return '#4ade80'
  }, [maxCount])

  const getGlow = useCallback((count: number) => {
    if (count === 0) return 'none'
    const ratio = count / maxCount
    if (ratio <= 0.5) return 'none'
    if (ratio <= 0.75) return 'drop-shadow(0 0 3px rgba(34,197,94,0.3))'
    return 'drop-shadow(0 0 6px rgba(74,222,128,0.5))'
  }, [maxCount])

  const hasData = total > 0
  const dayLabelW = 32
  const monthLabelH = 24
  const availableW = Math.max(400, containerW) - dayLabelW
  const cellGap = Math.max(2, Math.min(4, availableW / totalWeeks * 0.15))
  const cellSize = Math.max(8, (availableW - (totalWeeks - 1) * cellGap) / totalWeeks)
  const svgW = dayLabelW + totalWeeks * (cellSize + cellGap)
  const svgH = monthLabelH + 7 * (cellSize + cellGap) + cellGap
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const fontSize = Math.max(9, Math.min(12, cellSize * 0.7))

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6 sm:p-8`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Flame size={18} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
              {t('analytics.heatmap')}
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">
              {t('analytics.heatmapSub')}
            </p>
          </div>
        </div>
        {hasData && (
          <div className={`${GLASS_INNER} rounded-xl px-4 py-2 flex items-center gap-2`}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-mono font-bold text-white/70">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              {t('analytics.capturedStreams')}
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className={`${GLASS_INNER} rounded-2xl p-12 flex flex-col items-center gap-4`}>
          <CalendarDays size={36} className="text-white/10" />
          <p className="text-sm text-white/25 text-center max-w-sm">
            {t('analytics.noDataSub')}
          </p>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="w-full">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full block"
              preserveAspectRatio="xMidYMid meet"
            >
              {monthLabels.map((m, i) => (
                <text
                  key={i}
                  x={dayLabelW + m.col * (cellSize + cellGap) + cellSize / 2}
                  y={fontSize}
                  textAnchor="start"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={fontSize}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontWeight="600"
                >
                  {m.label}
                </text>
              ))}

              {dayLabels.map((label, row) => (
                <text
                  key={row}
                  x={dayLabelW - 8}
                  y={monthLabelH + row * (cellSize + cellGap) + cellSize / 2 + fontSize * 0.35}
                  textAnchor="end"
                  fill={row % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
                  fontSize={fontSize * 0.85}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontWeight="500"
                >
                  {label}
                </text>
              ))}

              {grid.map((cell, idx) => {
                if (cell.count === -1) return null
                const x = dayLabelW + cell.col * (cellSize + cellGap)
                const y = monthLabelH + cell.row * (cellSize + cellGap)
                const rx = Math.max(2, cellSize * 0.15)
                return (
                  <rect
                    key={cell.date || `pad-${idx}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={rx}
                    fill={getColor(cell.count)}
                    style={{ filter: getGlow(cell.count) }}
                    className="cursor-crosshair transition-[filter] duration-300"
                    onMouseEnter={(e) => {
                      setTooltip({ date: cell.date, count: cell.count, mx: e.clientX, my: e.clientY })
                    }}
                    onMouseMove={(e) => {
                      setTooltip((prev) => prev ? { ...prev, mx: e.clientX, my: e.clientY } : null)
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <animate
                      attributeName="opacity"
                      from="0"
                      to="1"
                      dur="0.5s"
                      begin={`${idx * 0.003}s`}
                      fill="freeze"
                    />
                  </rect>
                )
              })}
            </svg>
          </div>

          {tooltip && createPortal(
            <div
              className="fixed z-[99999] pointer-events-none"
              style={{
                left: Math.min(tooltip.mx + 12, window.innerWidth - 230),
                top: tooltip.my - 40,
              }}
            >
              <div className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
                <span className="font-mono text-white/60">{tooltip.date}</span>
                <span className="mx-2 text-white/15">|</span>
                <span className="font-bold text-green-400">
                  {tooltip.count} {tooltip.count === 1 ? 'stream' : 'streams'}
                </span>
              </div>
            </div>,
            document.body,
          )}

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-3 text-[11px] text-white/30">
              <span className="font-medium">{t('analytics.less')}</span>
              <div className="flex gap-1">
                {[
                  'rgba(255,255,255,0.025)',
                  '#0f3d1e',
                  '#166534',
                  '#22c55e',
                  '#4ade80',
                ].map((c, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-[3px]"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="font-medium">{t('analytics.more')}</span>
            </div>
            <span className="text-[11px] text-white/20 font-mono">
              {DAYS}d
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function PrimeTimeChart({ peakHours }: { peakHours: number[] }) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)

  const maxVal = useMemo(() => Math.max(1, ...peakHours), [peakHours])
  const peakIdx = useMemo(
    () => peakHours.indexOf(maxVal),
    [peakHours, maxVal],
  )
  const hasData = peakHours.some((v) => v > 0)
  const totalPlays = useMemo(() => peakHours.reduce((a, b) => a + b, 0), [peakHours])

  const w = 580
  const h = 180
  const pad = { top: 24, right: 16, bottom: 28, left: 16 }
  const barW = (w - pad.left - pad.right - 23 * 4) / 24
  const plotH = h - pad.top - pad.bottom

  const getBarColor = (i: number, val: number) => {
    if (val === 0) return 'rgba(255,255,255,0.04)'
    if (i === peakIdx) return 'url(#peakGrad)'
    if (hovered === i) return 'rgba(245,158,11,0.5)'
    const hour = i
    if (hour >= 20 || hour < 6) return 'rgba(245,158,11,0.25)'
    if (hour >= 17) return 'rgba(245,158,11,0.35)'
    return 'rgba(245,158,11,0.15)'
  }

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <BarChart3 size={18} className="text-amber-400" />
          <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
            {t('analytics.primeTime')}
          </h2>
        </div>
        {hasData && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/25 font-mono">{totalPlays.toLocaleString()} total</span>
          </div>
        )}
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
        <div className="overflow-x-auto hide-scrollbar">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full"
            style={{ minWidth: 420 }}
          >
            <defs>
              <linearGradient id="peakGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((frac) => {
              const y = pad.top + plotH - frac * plotH
              return (
                <line
                  key={frac}
                  x1={pad.left}
                  y1={y}
                  x2={w - pad.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="4 4"
                />
              )
            })}

            {peakHours.map((val, i) => {
              const pct = val / maxVal
              const barH = Math.max(pct * plotH, val > 0 ? 3 : 1)
              const x = pad.left + i * (barW + 4)
              const y = pad.top + plotH - barH
              const isHov = hovered === i
              const isPeak = i === peakIdx && val > 0

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-crosshair"
                >
                  <rect
                    x={x}
                    y={pad.top}
                    width={barW}
                    height={plotH}
                    fill="transparent"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={barW > 6 ? 3 : 2}
                    fill={getBarColor(i, val)}
                    className="transition-all duration-300"
                  />
                  {isPeak && (
                    <rect
                      x={x - 1}
                      y={y - 1}
                      width={barW + 2}
                      height={barH + 2}
                      rx={barW > 6 ? 4 : 3}
                      fill="none"
                      stroke="rgba(245,158,11,0.4)"
                      strokeWidth="1"
                    />
                  )}
                  {isHov && val > 0 && (
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-white/90"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="ui-monospace, monospace"
                    >
                      {val}
                    </text>
                  )}
                  {i % 2 === 0 && (
                    <text
                      x={x + barW / 2}
                      y={h - 6}
                      textAnchor="middle"
                      className="fill-white/15"
                      fontSize="8"
                      fontFamily="ui-monospace, monospace"
                    >
                      {String(i).padStart(2, '0')}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}

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

function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')

  if (data.length === 0) return null

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.current, d.previous)))
  const w = 600
  const h = 160
  const pad = { top: 10, right: 10, bottom: 20, left: 10 }
  const plotW = w - pad.left - pad.right
  const plotH = h - pad.top - pad.bottom

  const toPath = (points: number[]) =>
    points
      .map((val, i) => {
        const x = pad.left + (i / Math.max(1, points.length - 1)) * plotW
        const y = pad.top + plotH - (val / maxVal) * plotH
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
      })
      .join(' ')

  const toAreaPath = (points: number[]) => {
    const line = toPath(points)
    const lastX = pad.left + plotW
    const firstX = pad.left
    return `${line} L${lastX},${pad.top + plotH} L${firstX},${pad.top + plotH} Z`
  }

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
            {t('analytics.trends')}
          </h2>
        </div>
        <div className="flex gap-1">
          {(['weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${TRANSITION} ${
                period === p ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t(`analytics.${p}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 400 }}>
          <path d={toAreaPath(data.map((d) => d.previous))} fill="rgba(255,255,255,0.03)" />
          <path d={toPath(data.map((d) => d.previous))} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <path d={toAreaPath(data.map((d) => d.current))} fill="rgba(34,211,238,0.08)" />
          <path d={toPath(data.map((d) => d.current))} fill="none" stroke="#22d3ee" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <div className="w-3 h-[2px] bg-cyan-400 rounded" />
          {t('analytics.currentPeriod')}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <div className="w-3 h-[2px] bg-white/20 rounded" />
          {t('analytics.previousPeriod')}
        </div>
      </div>
    </div>
  )
}

function PopularRankings({ data }: { data: PopularItem[] }) {
  const { t } = useTranslation()

  if (data.length === 0) return null

  const maxPlays = Math.max(1, ...data.map((d) => d.playCount))

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <Trophy size={18} className="text-yellow-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.popularThisWeek')}
        </h2>
      </div>
      <div className="space-y-2">
        {data.map((item, idx) => {
          const pct = (item.playCount / maxPlays) * 100
          return (
            <div key={item.itemId} className={`${GLASS_INNER} rounded-2xl p-4 relative overflow-hidden`}>
              <div
                className="absolute inset-y-0 left-0 bg-yellow-500/[0.04] transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center gap-3">
                <span className="text-lg font-black text-white/20 w-7 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/80 truncate">{item.itemName}</p>
                  <p className="text-[10px] text-white/30 capitalize">{item.itemType}</p>
                </div>
                <span className="text-xs font-mono font-bold text-yellow-400 shrink-0">
                  {item.playCount} {t('analytics.plays')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UserLeaderboard({ data }: { data: UserComparisonEntry[] }) {
  const { t } = useTranslation()
  const config = useAppStore((s) => s.config)

  if (data.length === 0) return null

  const maxPlays = Math.max(1, ...data.map((d) => d.playCount))

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <Users size={18} className="text-indigo-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.userComparison')}
        </h2>
      </div>
      <div className="space-y-2">
        {data.map((entry, idx) => {
          const pct = (entry.playCount / maxPlays) * 100
          const avatarUrl = JellyfinAPI.getUserImageUrl(config.url, entry.userId)
          return (
            <div key={entry.userId} className={`${GLASS_INNER} rounded-2xl p-4 relative overflow-hidden`}>
              <div
                className="absolute inset-y-0 left-0 bg-indigo-500/[0.05] transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-black text-white/15 w-5 text-center shrink-0">{idx + 1}</span>
                  <UserAvatar url={avatarUrl} name={entry.userName} className="w-9 h-9 text-sm shrink-0" />
                  <p className="text-sm font-bold text-white/80 truncate">{entry.userName}</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400 shrink-0 ml-3">
                  {entry.playCount.toLocaleString()} {t('analytics.plays')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompletionRates({ data }: { data: CompletionRateEntry[] }) {
  const { t } = useTranslation()

  if (data.length === 0) return null

  const getColor = (rate: number) => {
    if (rate >= 80) return { bar: 'bg-green-500', text: 'text-green-400' }
    if (rate >= 40) return { bar: 'bg-amber-500', text: 'text-amber-400' }
    return { bar: 'bg-red-500', text: 'text-red-400' }
  }

  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <CheckCircle size={18} className="text-emerald-400" />
        <h2 className="text-sm font-bold tracking-wide text-white/80 uppercase">
          {t('analytics.completionRates')}
        </h2>
      </div>
      <div className="space-y-3">
        {data.slice(0, 10).map((item) => {
          const color = getColor(item.completionRate)
          return (
            <div key={item.itemId}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-white/70 truncate flex-1">{item.itemName}</p>
                <span className={`text-[11px] font-mono font-bold ${color.text} ml-2`}>
                  {item.completionRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full ${color.bar} transition-all duration-1000 ease-out`}
                  style={{ width: `${item.completionRate}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AnalyticsView() {
  const { t } = useTranslation()
  const { historyMap, peakHours, clients } = useMediaStore(
    (s) => s.analyticsData,
  )
  const counts = useMediaStore((s) => s.counts)
  const extendedAnalytics = useMediaStore((s) => s.extendedAnalytics)
  const setExtendedAnalytics = useMediaStore((s) => s.setExtendedAnalytics)
  const extendedLoaded = useRef(false)

  useEffect(() => {
    if (extendedLoaded.current) return
    extendedLoaded.current = true

    Promise.all([
      JellyfinAPI.getTrends(),
      JellyfinAPI.getPopularThisWeek(),
      JellyfinAPI.getUserComparison(),
      JellyfinAPI.getCompletionRates(),
    ]).then(([trends, popular, userComparison, completionRates]) => {
      setExtendedAnalytics({ trends, popular, userComparison, completionRates })
    })
  }, [setExtendedAnalytics])

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
      <div className="flex items-center gap-3">
        <PieChart size={22} className="text-white/60" />
        <h1 className="text-xl font-black tracking-tight text-white/90">
          {t('analytics.title')}
        </h1>
      </div>

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

      <WatchHeatmap historyMap={historyMap} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <PrimeTimeChart peakHours={peakHours} />
        <StorageDonut />
      </div>

      <ClientEcosystem clients={clients} />

      <TrendChart data={extendedAnalytics.trends} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <PopularRankings data={extendedAnalytics.popular} />
        <UserLeaderboard data={extendedAnalytics.userComparison} />
      </div>

      <CompletionRates data={extendedAnalytics.completionRates} />

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
