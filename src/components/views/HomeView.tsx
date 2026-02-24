import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Monitor,
  Users,
  Database,
  Activity,
  Clock,
  ChevronRight,
  Sparkles,
  Globe,
  Flame,
  CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useMediaStore } from '../../store/useMediaStore'
import { useUIStore } from '../../store/useUIStore'
import { JellyfinAPI } from '../../api/jellyfin'
import {
  GLASS_PANEL,
  GLASS_PANEL_HOVER,
  TRANSITION,
} from '../../design/tokens'
import StatCard from '../ui/StatCard'
import { SkeletonStatCard } from '../ui/Skeleton'
import CoverArt from '../ui/CoverArt'
import HeroTitleBox from '../ui/HeroTitleBox'
import MediaBadge from '../ui/MediaBadge'
import SessionCard from '../ui/SessionCard'
import type { NowPlayingItem } from '../../types/jellyfin'

/* ------------------------------------------------------------------ */
/*  Hero auto-rotate interval (ms)                                     */
/* ------------------------------------------------------------------ */
const HERO_INTERVAL = 8000

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Resolve display name for hero — always show parent (Series/Album/Film). */
function heroDisplayName(item: NowPlayingItem): string {
  if (item.Type === 'Series' && item.Name) return item.Name
  if (item.Type === 'Episode' && item.SeriesName) return item.SeriesName
  if ((item.Type === 'Audio' || item.Type === 'MusicAlbum') && item.Album) return item.Album
  return item.Name
}

function heroBackdropId(item: NowPlayingItem): string {
  if (item.ParentBackdropItemId) return item.ParentBackdropItemId
  if (item.Type === 'Episode' && item.SeriesId) return item.SeriesId
  if (item.Type === 'Audio' && item.AlbumId) return item.AlbumId
  return item.Id
}

function heroLogoId(item: NowPlayingItem): string | undefined {
  if (item.ParentLogoItemId) return item.ParentLogoItemId
  if (item.Type === 'Episode' && item.SeriesId) return item.SeriesId
  return undefined
}

/**
 * Group hero items: Episodes → Series, Audio → Album, Movies stay.
 * Deduplicates by parent ID so the same series doesn't appear twice.
 */
function groupHeroItems(items: NowPlayingItem[]): NowPlayingItem[] {
  const seen = new Set<string>()
  const grouped: NowPlayingItem[] = []

  for (const item of items) {
    if (item.Type === 'Episode' && item.SeriesId) {
      if (seen.has(item.SeriesId)) continue
      seen.add(item.SeriesId)
      grouped.push({
        Id: item.SeriesId,
        Name: item.SeriesName || item.Name,
        Type: 'Series',
        ParentBackdropItemId: item.ParentBackdropItemId,
        ParentLogoItemId: item.ParentLogoItemId,
        Overview: item.Overview,
        ProductionYear: item.ProductionYear,
      })
    } else if (item.Type === 'Audio' && item.AlbumId) {
      if (seen.has(item.AlbumId)) continue
      seen.add(item.AlbumId)
      grouped.push({
        Id: item.AlbumId,
        Name: item.Album || item.Name,
        Type: 'MusicAlbum',
        Artists: item.Artists,
        AlbumId: item.AlbumId,
        Album: item.Album,
        Overview: item.Overview,
        ProductionYear: item.ProductionYear,
      })
    } else {
      if (seen.has(item.Id)) continue
      seen.add(item.Id)
      grouped.push(item)
    }
  }

  return grouped
}

/** How many users are "online" = activity within the last 5 minutes. */
function countOnlineUsers(
  users: { LastActivityDate: string }[],
  now: number,
): number {
  const threshold = 5 * 60 * 1000
  return users.filter(
    (u) => now - new Date(u.LastActivityDate).getTime() < threshold,
  ).length
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function HomeView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { config, isDemoMode } = useAppStore()
  const { sessions, users, counts, libraryData, news } = useMediaStore()
  const {
    heroIndex,
    setHeroIndex,
    setSelectedItem,
    setSelectedNews,
    currentTime,
  } = useUIStore()

  /* ---------------------------------------------------------------- */
  /*  Hero carousel data                                               */
  /* ---------------------------------------------------------------- */
  const { heroItems: storeHeroItems } = useMediaStore()

  const heroItems = useMemo<NowPlayingItem[]>(() => {
    // Use random Movies/Series from the store; fallback to latest items
    if (storeHeroItems.length > 0) return storeHeroItems.slice(0, 8)
    const raw = libraryData.latest.slice(0, 12)
    return groupHeroItems(raw).slice(0, 6)
  }, [storeHeroItems, libraryData.latest])
  const safeIndex =
    heroItems.length > 0 ? heroIndex % heroItems.length : 0
  const activeHeroItem = heroItems[safeIndex] ?? null

  /* Auto-rotate */
  useEffect(() => {
    if (heroItems.length <= 1) return
    const timer = setInterval(() => {
      setHeroIndex((heroIndex + 1) % heroItems.length)
    }, HERO_INTERVAL)
    return () => clearInterval(timer)
  }, [heroIndex, heroItems.length, setHeroIndex])

  /* ---------------------------------------------------------------- */
  /*  Quick-glance values                                              */
  /* ---------------------------------------------------------------- */
  const onlineUsers = countOnlineUsers(users, currentTime)
  const movieEpisodeCount =
    (counts?.MovieCount ?? 0) + (counts?.EpisodeCount ?? 0)

  /* ---------------------------------------------------------------- */
  /*  Hero backdrop / logo URLs                                        */
  /* ---------------------------------------------------------------- */
  const backdropUrl = activeHeroItem
    ? JellyfinAPI.getItemImageUrl(
        config.url,
        heroBackdropId(activeHeroItem),
        'Backdrop',
      )
    : undefined

  const logoId = activeHeroItem ? heroLogoId(activeHeroItem) : undefined
  const logoUrl = logoId
    ? JellyfinAPI.getLogoUrl(config.url, logoId)
    : undefined

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/*  1. HERO SECTION (75vh, edge-to-edge)                        */}
      {/* ============================================================ */}
      <section className="relative w-full h-[70vh] md:h-[75vh] overflow-hidden select-none">
        {/* Backdrop image with Ken Burns */}
        {backdropUrl && (
          <img
            key={safeIndex}
            src={backdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-hero-kb"
          />
        )}

        {/* Gradient overlays — multi-layer for smooth bottom transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] from-0% via-[#020202]/70 via-30% to-transparent to-80%" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/80 via-[#020202]/20 via-50% to-transparent" />
        {/* Extra soft fade at the very bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020202] to-transparent" />

        {/* Content — staggered entrance */}
        {activeHeroItem && (
          <div key={safeIndex} className="absolute inset-0 flex flex-col justify-end px-6 pb-14 sm:px-10 sm:pb-18 md:px-16 lg:px-24">
            {/* Badges row */}
            <div className="flex items-center gap-3 mb-5 animate-hero-content" style={{ animationDelay: '0.1s' }}>
              <MediaBadge type={activeHeroItem.Type} />
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-400/15 text-amber-400/90 border border-amber-400/20 backdrop-blur-sm">
                <Sparkles size={12} />
                {t('home.spotlight')}
              </span>
            </div>

            {/* Title (logo or text) */}
            <div className="animate-hero-content" style={{ animationDelay: '0.2s' }}>
              <HeroTitleBox
                title={heroDisplayName(activeHeroItem)}
                logoUrl={logoUrl}
              />
            </div>

            {/* Artist subtitle for albums */}
            {activeHeroItem.Type === 'MusicAlbum' && activeHeroItem.Artists && activeHeroItem.Artists.length > 0 && (
              <p className="text-white/50 text-sm font-bold tracking-wide mb-2 animate-hero-content" style={{ animationDelay: '0.3s' }}>
                {activeHeroItem.Artists.join(', ')}
              </p>
            )}

            {/* Overview snippet */}
            {activeHeroItem.Overview && (
              <p className="text-white/40 text-sm leading-relaxed max-w-2xl line-clamp-3 mb-6 animate-hero-content" style={{ animationDelay: '0.35s' }}>
                {activeHeroItem.Overview}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-4 animate-hero-content" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={() => setSelectedItem(activeHeroItem)}
                className={`rounded-2xl px-7 py-3 text-sm font-bold flex items-center gap-2 ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}
              >
                <CheckCircle2 size={16} />
                {t('home.viewDetails')}
              </button>
            </div>
          </div>
        )}

        {/* Carousel indicators (bottom right) */}
        {heroItems.length > 1 && (
          <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 md:right-16 lg:right-24 flex items-center gap-1.5 z-20">
            {heroItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`rounded-full transition-all duration-500 ${
                  idx === safeIndex
                    ? 'w-8 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  CONTENT WRAPPER (max-width + padding)                       */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 flex flex-col gap-10 relative -mt-20 z-10">

      {/* ============================================================ */}
      {/*  2. QUICK GLANCE BENTO (3 columns)                           */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        {counts === null ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              value={sessions.length}
              label={t('home.activeStreams')}
              icon={Monitor}
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
              highlight={sessions.length > 0}
              onClick={() => navigate('/radar')}
              badge={
                sessions.length > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-400">
                    <Activity size={10} className="animate-pulse" />
                    LIVE
                  </span>
                ) : undefined
              }
            />

            <StatCard
              value={onlineUsers}
              label={t('home.usersOnline')}
              icon={Users}
              iconColor="text-indigo-400"
              iconBg="bg-indigo-500/10"
              onClick={() => navigate('/users')}
            />

            <StatCard
              value={movieEpisodeCount.toLocaleString()}
              label={t('home.moviesEpisodes')}
              icon={Database}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
              onClick={() => navigate('/library')}
            />
          </>
        )}
      </section>

      {/* ============================================================ */}
      {/*  3. RADAR HOME ROW                                           */}
      {/* ============================================================ */}
      <section>
        {/* Section heading */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Flame size={20} className="text-orange-400" />
            <h3 className="text-lg font-black tracking-tight">
              {sessions.length > 0
                ? t('home.currentTransmissions')
                : t('home.brandNew')}
            </h3>
          </div>
          <button
            onClick={() =>
              navigate(sessions.length > 0 ? '/radar' : '/library')
            }
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            {t('home.viewAll')}
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Active sessions grid */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-10 pt-4">
            {sessions.map((session) => (
              <SessionCard key={session.Id} session={session} />
            ))}
          </div>
        ) : (
          /* Latest items poster grid (no sessions) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {libraryData.latest.slice(0, 12).map((item) => (
              <div
                key={item.Id}
                onClick={() => setSelectedItem(item)}
                className={`rounded-[2.5rem] overflow-hidden cursor-pointer group ${TRANSITION}`}
              >
                <CoverArt
                  url={JellyfinAPI.getItemImageUrl(config.url, item.Id)}
                  title={item.Name}
                  isDemo={isDemoMode}
                  type={item.Type}
                  className="aspect-[2/3]"
                />
                <div className="pt-3 pb-1 px-1">
                  <p className="text-xs font-bold truncate">{item.Name}</p>
                  <p className="text-[10px] text-white/40 truncate">
                    {item.ProductionYear ?? ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  4. NEWS SECTION                                             */}
      {/* ============================================================ */}
      {news.length > 0 && (
        <section className="pb-10">
          {/* Section heading */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-sky-400" />
              <h3 className="text-lg font-black tracking-tight">
                {t('home.news')}
              </h3>
            </div>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {news.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedNews(item)}
                className={`flex-shrink-0 w-72 rounded-[2.5rem] overflow-hidden snap-start cursor-pointer group ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}
              >
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                {/* Card body */}
                <div className="p-5">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clock size={10} />
                    {new Date(item.pubDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-black leading-snug line-clamp-2">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      </div>{/* END content wrapper */}
    </div>
  )
}
