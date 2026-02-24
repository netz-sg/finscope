import { GLASS_PANEL } from '../../design/tokens'

/** Base shimmer box */
export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />
  )
}

/** Matches the StatCard shape */
export function SkeletonStatCard() {
  return (
    <div className={`${GLASS_PANEL} rounded-[2.5rem] p-6 flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] animate-pulse" />
      </div>
      <div>
        <div className="h-9 w-20 rounded-lg bg-white/[0.04] animate-pulse mb-2" />
        <div className="h-3 w-28 rounded bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

/** Full-width panel skeleton */
export function SkeletonPanel({ className = '', lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6 ${className}`}>
      <div className="h-5 w-40 rounded-lg bg-white/[0.04] animate-pulse mb-5" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-white/[0.04] animate-pulse" style={{ width: `${85 - i * 12}%` }} />
        ))}
      </div>
    </div>
  )
}

/** Matches RadarView SessionCard shape */
export function SkeletonSessionCard() {
  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-5`}>
      <div className="flex gap-4">
        <div className="w-12 h-[72px] rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-white/[0.04] animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-7 w-3/4 rounded-lg bg-white/[0.04] animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-2 w-full rounded-full bg-white/[0.04] animate-pulse mt-2" />
        </div>
      </div>
    </div>
  )
}

/** Cover art placeholder for library */
export function SkeletonCoverCard() {
  return (
    <div className="shrink-0 w-[140px]">
      <div className="w-[140px] h-[210px] rounded-2xl bg-white/[0.04] animate-pulse" />
      <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse mt-2.5" />
      <div className="h-2.5 w-16 rounded bg-white/[0.04] animate-pulse mt-1.5" />
    </div>
  )
}
