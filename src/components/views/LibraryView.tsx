import { useTranslation } from 'react-i18next'
import { Film, Tv, Clapperboard, Music, FolderOpen, Play, Star, Trophy } from 'lucide-react'
import { useMediaStore } from '../../store/useMediaStore'
import { useAppStore } from '../../store/useAppStore'
import { useUIStore } from '../../store/useUIStore'
import { GLASS_PANEL, GLASS_INNER, GLASS_PANEL_HOVER, TRANSITION } from '../../design/tokens'
import { getMediaTypeConfig } from '../../utils/mediaTypes'
import { JellyfinAPI } from '../../api/jellyfin'
import CoverArt from '../ui/CoverArt'
import { SkeletonStatCard, SkeletonCoverCard } from '../ui/Skeleton'

const GENRE_PALETTE = [
  { pill: 'bg-blue-400/15 border-blue-400/25 text-blue-300', dot: 'bg-blue-400' },
  { pill: 'bg-purple-400/15 border-purple-400/25 text-purple-300', dot: 'bg-purple-400' },
  { pill: 'bg-emerald-400/15 border-emerald-400/25 text-emerald-300', dot: 'bg-emerald-400' },
  { pill: 'bg-pink-400/15 border-pink-400/25 text-pink-300', dot: 'bg-pink-400' },
  { pill: 'bg-amber-400/15 border-amber-400/25 text-amber-300', dot: 'bg-amber-400' },
  { pill: 'bg-cyan-400/15 border-cyan-400/25 text-cyan-300', dot: 'bg-cyan-400' },
  { pill: 'bg-rose-400/15 border-rose-400/25 text-rose-300', dot: 'bg-rose-400' },
  { pill: 'bg-indigo-400/15 border-indigo-400/25 text-indigo-300', dot: 'bg-indigo-400' },
]

const RANK_META = [
  { ghost: 'text-[96px] text-amber-400/[0.08]', num: 'text-amber-400', pill: 'bg-amber-400/15 border-amber-400/30 text-amber-400', icon: 'text-amber-400' },
  { ghost: 'text-[80px] text-slate-400/[0.07]', num: 'text-slate-300', pill: 'bg-white/[0.05] border-white/[0.08] text-white/60', icon: 'text-white/40' },
  { ghost: 'text-[72px] text-amber-700/[0.07]', num: 'text-amber-700/80', pill: 'bg-white/[0.05] border-white/[0.08] text-white/60', icon: 'text-white/40' },
  { ghost: 'text-[64px] text-white/[0.04]', num: 'text-white/30', pill: 'bg-white/[0.04] border-white/[0.06] text-white/40', icon: 'text-white/30' },
  { ghost: 'text-[64px] text-white/[0.04]', num: 'text-white/30', pill: 'bg-white/[0.04] border-white/[0.06] text-white/40', icon: 'text-white/30' },
]

function folderIcon(collectionType: string) {
  switch (collectionType) {
    case 'movies': return <Film size={24} className="text-blue-400" />
    case 'tvshows': return <Tv size={24} className="text-purple-400" />
    case 'music': return <Music size={24} className="text-pink-400" />
    default: return <FolderOpen size={24} className="text-white/60" />
  }
}

function folderAccent(collectionType: string) {
  switch (collectionType) {
    case 'movies': return 'bg-blue-400/15'
    case 'tvshows': return 'bg-purple-400/15'
    case 'music': return 'bg-pink-400/15'
    default: return 'bg-white/[0.06]'
  }
}

export default function LibraryView() {
  const { t } = useTranslation()
  const counts = useMediaStore((s) => s.counts)
  const genreData = useMediaStore((s) => s.genreData)
  const { mostPlayed, latest, libraries } = useMediaStore((s) => s.libraryData)
  const { config, isDemoMode } = useAppStore()
  const { setSelectedItem } = useUIStore()

  const totalVideoItems = (counts?.MovieCount ?? 0) + (counts?.EpisodeCount ?? 0)
  const estimatedHours = Math.round(totalVideoItems * 0.75)

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counts === null ? (
          <>
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </>
        ) : (
          <>
            <div className={`relative ${GLASS_PANEL} rounded-3xl p-6 overflow-hidden cursor-default`}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-[0.12]" />
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              <Film size={15} className="text-blue-400/50 mb-4" />
              <p className="text-5xl font-black tracking-tight text-blue-400 tabular-nums">
                {(counts.MovieCount ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mt-2">
                {t('library.movies')}
              </p>
            </div>

            <div className={`relative ${GLASS_PANEL} rounded-3xl p-6 overflow-hidden cursor-default`}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-[0.12]" />
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
              <Tv size={15} className="text-purple-400/50 mb-4" />
              <p className="text-5xl font-black tracking-tight text-purple-400 tabular-nums">
                {(counts.SeriesCount ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mt-2">
                {t('library.series')}
              </p>
            </div>

            <div className={`relative ${GLASS_PANEL} rounded-3xl p-6 overflow-hidden cursor-default`}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400 rounded-full blur-3xl opacity-[0.12]" />
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
              <Clapperboard size={15} className="text-emerald-400/50 mb-4" />
              <p className="text-5xl font-black tracking-tight text-emerald-400 tabular-nums">
                {(counts.EpisodeCount ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mt-2">
                {t('library.episodes')}
              </p>
            </div>

            <div className={`relative ${GLASS_PANEL} rounded-3xl p-6 overflow-hidden cursor-default`}>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-400 rounded-full blur-3xl opacity-[0.12]" />
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-pink-400/60 to-transparent" />
              <Music size={15} className="text-pink-400/50 mb-4" />
              <p className="text-5xl font-black tracking-tight text-pink-400 tabular-nums">
                {(counts.SongCount ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest mt-2">
                {t('library.music')}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className={`lg:col-span-2 ${GLASS_PANEL} rounded-3xl p-6`}>
          <div className="flex items-center gap-2.5 mb-6">
            <Trophy size={15} className="text-amber-400/70" />
            <h2 className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              {t('library.allTimeFavorites')}
            </h2>
          </div>

          {mostPlayed.length === 0 ? (
            <p className="text-white/30 text-sm">{t('library.noData')}</p>
          ) : (
            <div className="space-y-2">
              {mostPlayed.slice(0, 5).map((item, idx) => {
                const cfg = getMediaTypeConfig(item.Type)
                const rank = RANK_META[idx]
                return (
                  <div
                    key={item.Id}
                    className={`${GLASS_INNER} rounded-2xl px-4 py-3 flex items-center gap-4 relative overflow-hidden ${TRANSITION} hover:bg-white/[0.04]`}
                  >
                    <span
                      className={`absolute right-3 bottom-0 font-black leading-none select-none pointer-events-none tabular-nums ${rank.ghost}`}
                      aria-hidden="true"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <span className={`text-lg font-black tabular-nums w-6 shrink-0 ${rank.num}`}>
                      {idx + 1}
                    </span>

                    <div className="shrink-0">
                      <CoverArt
                        url={JellyfinAPI.getItemImageUrl(config.url, item.Id)}
                        title={item.Name}
                        isDemo={isDemoMode}
                        type={item.Type}
                        className="w-9 h-[52px] !rounded-xl"
                      />
                    </div>

                    <div className="min-w-0 flex-1 relative z-10">
                      <p className="text-sm font-bold text-white/90 truncate">{item.Name}</p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5">
                        <cfg.icon size={10} className={cfg.color} />
                        {item.ProductionYear ?? cfg.label}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full border relative z-10 ${rank.pill}`}>
                      <Play size={9} className={rank.icon} />
                      <span className="text-xs font-black tabular-nums">{item.PlayCount ?? 0}</span>
                      <span className="text-[9px] font-bold opacity-60 uppercase">{t('library.plays')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${GLASS_PANEL} rounded-3xl p-6 flex flex-col`}>
          <div className="flex items-center gap-2.5 mb-5">
            <Star size={15} className="text-white/40" />
            <h2 className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              {t('library.genreDistribution')}
            </h2>
          </div>

          {genreData.length === 0 ? (
            <p className="text-white/30 text-sm">{t('library.noGenres')}</p>
          ) : (
            <div className="flex flex-wrap gap-2 flex-1">
              {genreData.map((g, idx) => {
                const palette = GENRE_PALETTE[idx % GENRE_PALETTE.length]
                const isLarge = g.pct >= 20
                const isMed = g.pct >= 10
                const pillSize = isLarge ? 'px-4 py-2 text-sm' : isMed ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[10px]'
                const opacityClass = isLarge ? 'opacity-100' : isMed ? 'opacity-80' : 'opacity-55'
                return (
                  <div
                    key={g.name}
                    className={`flex items-center gap-1.5 rounded-full border ${palette.pill} ${pillSize} ${opacityClass} ${TRANSITION} hover:opacity-100 hover:scale-105`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${palette.dot} shrink-0`} />
                    <span className="font-bold">{g.name}</span>
                    <span className="font-black opacity-60">{g.pct}%</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className={`${GLASS_INNER} rounded-2xl p-5 mt-5 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
            <p className="text-4xl font-black tracking-tight text-white relative z-10 tabular-nums">
              {estimatedHours.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1.5 relative z-10">
              {t('library.totalWatchTime')} · {t('library.hours')}
            </p>
          </div>
        </div>
      </div>

      <div className={`${GLASS_PANEL} rounded-3xl p-6`}>
        <h2 className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-6">
          {t('library.recentlyAdded')}
        </h2>

        {counts === null ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCoverCard key={i} />)}
          </div>
        ) : latest.length === 0 ? (
          <p className="text-white/30 text-sm">{t('library.noNewMedia')}</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar">
            {latest.map((item) => {
              const cfg = getMediaTypeConfig(item.Type)
              return (
                <div key={item.Id} onClick={() => setSelectedItem(item)} className={`shrink-0 w-[140px] group cursor-pointer ${TRANSITION}`}>
                  <div className="relative overflow-hidden rounded-2xl">
                    <CoverArt
                      url={JellyfinAPI.getItemImageUrl(config.url, item.Id)}
                      title={item.Name}
                      isDemo={isDemoMode}
                      type={item.Type}
                      className="w-[140px] h-[210px] !rounded-2xl transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 ${cfg.color}`}>
                        <cfg.icon size={8} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white/80 mt-2.5 truncate">{item.Name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.ProductionYear ?? ''}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {libraries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {libraries.map((lib) => (
            <div
              key={lib.Id}
              className={`${GLASS_PANEL} ${GLASS_PANEL_HOVER} rounded-3xl p-5 flex items-center gap-4`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${folderAccent(lib.CollectionType)}`}>
                {folderIcon(lib.CollectionType)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white/90 truncate">{lib.Name}</p>
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
