import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, AlignLeft, Disc3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { JellyfinAPI } from '../../api/jellyfin'
import { GLASS_PANEL, GLASS_PANEL_HOVER } from '../../design/tokens'
import CoverArt from '../ui/CoverArt'
import type { ItemDetail, NowPlayingItem } from '../../types/jellyfin'

export default function ArtistDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { config, isDemoMode } = useAppStore()

  const [artist, setArtist] = useState<ItemDetail | null>(null)
  const [albums, setAlbums] = useState<NowPlayingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      JellyfinAPI.getItemDetail(config.url, config.apiKey, config.userId, id),
      JellyfinAPI.getArtistAlbums(config.url, config.apiKey, config.userId, id),
    ])
      .then(([artistData, albumData]) => {
        setArtist(artistData)
        setAlbums(albumData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, config])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Activity className="animate-pulse text-white/30" size={40} />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32">
        <p className="text-white/40 text-sm">{t('library.noData')}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
        >
          {t('home.viewAll')}
        </button>
      </div>
    )
  }

  const backdropUrl = JellyfinAPI.getItemImageUrl(config.url, artist.Id, 'Backdrop')
  const primaryUrl = JellyfinAPI.getItemImageUrl(config.url, artist.Id, 'Primary')

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative w-full h-[50vh] overflow-hidden">
        <img
          src={backdropUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/80 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-28 left-6 sm:left-10 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Artist name */}
        <div className="absolute inset-0 flex items-end px-6 pb-10 sm:px-10 md:px-16 lg:px-24">
          <div className="flex items-end gap-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <img
                src={primaryUrl}
                alt={artist.Name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.parentElement!.classList.add('bg-white/5')
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                {t('detail.artist')}
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none drop-shadow-xl">
                {artist.Name}
              </h1>
              {artist.ProductionYear && (
                <p className="text-sm font-mono text-white/40 mt-2">
                  {artist.ProductionYear}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 flex flex-col gap-10 pt-10 pb-10">
        {/* Biography */}
        {artist.Overview && (
          <section className={`rounded-[2rem] p-8 ${GLASS_PANEL}`}>
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlignLeft size={14} /> {t('detail.biography')}
            </h3>
            <p className="text-white/70 leading-relaxed text-sm md:text-base font-light text-pretty">
              {artist.Overview}
            </p>
          </section>
        )}

        {/* Genres */}
        {artist.Genres && artist.Genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {artist.Genres.map((g) => (
              <span
                key={g}
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Discography */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Disc3 size={20} className="text-violet-400" />
            <h3 className="text-lg font-black tracking-tight">
              {t('detail.discography')}
            </h3>
            <span className="text-xs font-mono text-white/30">
              {t('detail.tracks', { count: albums.length })}
            </span>
          </div>

          {albums.length === 0 ? (
            <p className="text-sm text-white/30">{t('detail.noAlbums')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {albums.map((album) => (
                <div
                  key={album.Id}
                  onClick={() => navigate(`/album/${album.Id}`)}
                  className={`rounded-[2rem] overflow-hidden cursor-pointer group ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}
                >
                  <CoverArt
                    url={JellyfinAPI.getItemImageUrl(config.url, album.Id, 'Primary')}
                    title={album.Name}
                    isDemo={isDemoMode}
                    type="MusicAlbum"
                    className="aspect-square"
                  />
                  <div className="p-4">
                    <p className="text-sm font-bold truncate">{album.Name}</p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {album.ProductionYear ?? ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
