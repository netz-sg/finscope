import { useTranslation } from 'react-i18next'
import { Film, Tv, Clapperboard, Music, FolderOpen, Play, Star } from 'lucide-react'
import { useMediaStore } from '../../store/useMediaStore'
import { useAppStore } from '../../store/useAppStore'
import { GLASS_PANEL, GLASS_INNER } from '../../design/tokens'
import { getMediaTypeConfig } from '../../utils/mediaTypes'
import { JellyfinAPI } from '../../api/jellyfin'
import CoverArt from '../ui/CoverArt'
import { SkeletonStatCard, SkeletonCoverCard } from '../ui/Skeleton'

/* ------------------------------------------------------------------ */
/*  Stat Card                                                         */
/* ------------------------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  count,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  count: number
  iconBg: string
  iconColor: string
}) {
  return (
    <div className={`${GLASS_PANEL} rounded-3xl p-6 flex items-center gap-5`}>
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-white">
          {count.toLocaleString()}
        </p>
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mt-0.5">
          {label}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Genre color palette                                               */
/* ------------------------------------------------------------------ */
const GENRE_COLORS = [
  'bg-blue-400', 'bg-purple-400', 'bg-emerald-400',
  'bg-amber-400', 'bg-pink-400', 'bg-cyan-400',
  'bg-rose-400', 'bg-indigo-400',
]

/* ------------------------------------------------------------------ */
/*  Folder icon resolver                                              */
/* ------------------------------------------------------------------ */
function folderIcon(collectionType: string) {
  switch (collectionType) {
    case 'movies':
      return <Film size={20} className="text-blue-400" />
    case 'tvshows':
      return <Tv size={20} className="text-purple-400" />
    case 'music':
      return <Music size={20} className="text-pink-400" />
    default:
      return <FolderOpen size={20} className="text-white/60" />
  }
}

/* ================================================================== */
/*  LibraryView                                                       */
/* ================================================================== */
export default function LibraryView() {
  const { t } = useTranslation()
  const counts = useMediaStore((s) => s.counts)
  const genreData = useMediaStore((s) => s.genreData)
  const { mostPlayed, latest, libraries } = useMediaStore((s) => s.libraryData)
  const { config, isDemoMode } = useAppStore()

  const totalVideoItems =
    (counts?.MovieCount ?? 0) + (counts?.EpisodeCount ?? 0)
  const estimatedHours = Math.round(totalVideoItems * 0.75)

  return (
    <div className="space-y-8">
      {/* ── Top Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              icon={Film}
              label={t('library.movies')}
              count={counts.MovieCount ?? 0}
              iconBg="bg-blue-400/15"
              iconColor="text-blue-400"
            />
            <StatCard
              icon={Tv}
              label={t('library.series')}
              count={counts.SeriesCount ?? 0}
              iconBg="bg-purple-400/15"
              iconColor="text-purple-400"
            />
            <StatCard
              icon={Clapperboard}
              label={t('library.episodes')}
              count={counts.EpisodeCount ?? 0}
              iconBg="bg-emerald-400/15"
              iconColor="text-emerald-400"
            />
            <StatCard
              icon={Music}
              label={t('library.music')}
              count={counts.SongCount ?? 0}
              iconBg="bg-pink-400/15"
              iconColor="text-pink-400"
            />
          </>
        )}
      </div>

      {/* ── Bento Grid (2/3 + 1/3) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: All-Time Favorites */}
        <div className={`lg:col-span-2 ${GLASS_PANEL} rounded-3xl p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Star size={18} className="text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase">
              {t('library.allTimeFavorites')}
            </h2>
          </div>

          {mostPlayed.length === 0 ? (
            <p className="text-white/30 text-sm">{t('library.noData')}</p>
          ) : (
            <div className="space-y-3">
              {mostPlayed.slice(0, 5).map((item, idx) => {
                const cfg = getMediaTypeConfig(item.Type)
                return (
                  <div
                    key={item.Id}
                    className={`${GLASS_INNER} rounded-2xl p-3 flex items-center gap-4 group`}
                  >
                    {/* Rank */}
                    <span className="text-lg font-black text-white/20 w-7 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Cover thumbnail */}
                    <CoverArt
                      url={JellyfinAPI.getItemImageUrl(config.url, item.Id)}
                      title={item.Name}
                      isDemo={isDemoMode}
                      type={item.Type}
                      className="w-10 h-14 shrink-0 !rounded-lg"
                    />

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.Name}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                        <cfg.icon size={12} className={cfg.color} />
                        {cfg.label}
                        {item.ProductionYear && (
                          <span className="ml-1 text-white/25">
                            {item.ProductionYear}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Play count badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Play size={12} className="text-white/30" />
                      <span className="text-xs font-mono font-bold text-white/60">
                        {item.PlayCount ?? 0}
                      </span>
                      <span className="text-[10px] text-white/25 uppercase">
                        {t('library.plays')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Content Matrix */}
        <div className={`${GLASS_PANEL} rounded-3xl p-6 flex flex-col justify-between`}>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase mb-6">
              {t('library.contentMatrix')}
            </h2>

            {genreData.length === 0 ? (
              <p className="text-white/30 text-sm">{t('library.noGenres')}</p>
            ) : (
              <div className="space-y-4">
                {genreData.map((g, idx) => (
                  <div key={g.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/60 font-medium">{g.name}</span>
                      <span className="text-xs font-mono text-white/40">{g.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${GENRE_COLORS[idx % GENRE_COLORS.length]} transition-all duration-1000 ease-out`}
                        style={{ width: `${g.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total watch time stat */}
          <div className={`${GLASS_INNER} rounded-2xl p-4 mt-6 text-center`}>
            <p className="text-3xl font-black tracking-tight text-white">
              {estimatedHours.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest mt-1">
              {t('library.totalWatchTime')} ({t('library.hours')})
            </p>
          </div>
        </div>
      </div>

      {/* ── Recently Added ───────────────────────────────────────── */}
      <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
        <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase mb-5">
          {t('library.recentlyAdded')}
        </h2>

        {counts === null ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCoverCard key={i} />)}
          </div>
        ) : latest.length === 0 ? (
          <p className="text-white/30 text-sm">{t('library.noNewMedia')}</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {latest.map((item) => {
              const cfg = getMediaTypeConfig(item.Type)
              return (
                <div
                  key={item.Id}
                  className="shrink-0 w-[140px] group cursor-pointer"
                >
                  <CoverArt
                    url={JellyfinAPI.getItemImageUrl(config.url, item.Id)}
                    title={item.Name}
                    isDemo={isDemoMode}
                    type={item.Type}
                    className="w-[140px] h-[210px] group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] transition-all duration-500 group-hover:-translate-y-1"
                  />
                  <p className="text-xs font-semibold text-white/80 mt-2.5 truncate">
                    {item.Name}
                  </p>
                  <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                    <cfg.icon size={10} className={cfg.color} />
                    {item.ProductionYear ?? ''}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Library Folders ──────────────────────────────────────── */}
      {libraries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {libraries.map((lib) => (
            <div
              key={lib.Id}
              className={`${GLASS_PANEL} rounded-3xl p-5 flex items-center gap-4`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  lib.CollectionType === 'movies'
                    ? 'bg-blue-400/15'
                    : lib.CollectionType === 'tvshows'
                      ? 'bg-purple-400/15'
                      : lib.CollectionType === 'music'
                        ? 'bg-pink-400/15'
                        : 'bg-white/[0.06]'
                }`}
              >
                {folderIcon(lib.CollectionType)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {lib.Name}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                  {lib.CollectionType || 'mixed'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
