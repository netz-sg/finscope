export const ticksToSeconds = (ticks: number | undefined): number =>
  Math.floor((ticks || 0) / 10_000_000)

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`
}

export const timeAgo = (dateString: string | undefined, t: (key: string, opts?: Record<string, unknown>) => string): string => {
  if (!dateString) return t('time.never')
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return t('time.justNow')

  const intervals: [string, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]

  for (const [unit, value] of intervals) {
    const count = Math.floor(seconds / value)
    if (count >= 1) {
      return t('time.ago', { count, unit: t(`time.units.${unit}`, { count }) })
    }
  }

  return t('time.justNow')
}
