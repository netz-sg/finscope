import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, Clock, Music, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { JellyfinAPI } from '../../api/jellyfin'
import { GLASS_PANEL, GLASS_INNER } from '../../design/tokens'
import { ticksToSeconds, formatTime } from '../../utils/time'
import CoverArt from '../ui/CoverArt'
import type { ItemDetail, AlbumTrack } from '../../types/jellyfin'

export default function AlbumDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { config, isDemoMode } = useAppStore()

  const [album, setAlbum] = useState<ItemDetail | null>(null)
  const [tracks, setTracks] = useState<AlbumTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([
      JellyfinAPI.getItemDetail(config.url, config.apiKey, config.userId, id),
      JellyfinAPI.getAlbumTracks(config.url, config.apiKey, config.userId, id),
    ])
      .then(([albumData, trackData]) => {
        setAlbum(albumData)
        setTracks(trackData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, config])

  const totalDuration = useMemo(
    () => tracks.reduce((sum, tr) => sum + (tr.RunTimeTicks ?? 0), 0),
    [tracks],
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Activity className="animate-pulse text-white/30" size={40} />
      </div>
    )
  }

  if (!album) {
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

  const artistItem = album.ArtistItems?.[0]

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all self-start"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Album header: Cover + Info */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Cover */}
        <div className="w-full md:w-72 lg:w-80 shrink-0">
          <CoverArt
            url={JellyfinAPI.getItemImageUrl(config.url, album.Id, 'Primary')}
            title={album.Name}
            isDemo={isDemoMode}
            type="MusicAlbum"
            className="w-full aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
          />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
            {t('detail.album')}
          </p>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-4 drop-shadow-xl text-balance">
            {album.Name}
          </h1>

          {/* Artist link */}
          {artistItem ? (
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-white/30 shrink-0" />
              <button
                onClick={() => navigate(`/artist/${artistItem.Id}`)}
                className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
              >
                {artistItem.Name}
              </button>
            </div>
          ) : album.Artists && album.Artists.length > 0 ? (
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-white/30 shrink-0" />
              <p className="text-sm text-white/60">{album.Artists.join(', ')}</p>
            </div>
          ) : null}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {album.ProductionYear && (
              <span className="text-sm font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                {album.ProductionYear}
              </span>
            )}
            {tracks.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Music size={14} />
                {t('detail.tracks', { count: tracks.length })}
              </span>
            )}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Clock size={14} />
                {formatTime(ticksToSeconds(totalDuration))}
              </span>
            )}
          </div>

          {/* Genres */}
          {album.Genres && album.Genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {album.Genres.map((g) => (
                <span
                  key={g}
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track listing */}
      <section className={`rounded-[2rem] p-6 sm:p-8 ${GLASS_PANEL}`}>
        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Music size={14} /> {t('detail.trackList')}
        </h3>

        {tracks.length === 0 ? (
          <p className="text-sm text-white/30">{t('detail.noTracks')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {tracks.map((track, idx) => (
              <div
                key={track.Id}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl ${GLASS_INNER} hover:bg-white/[0.04]`}
              >
                {/* Track number */}
                <span className="w-8 text-right text-xs font-mono text-white/30 shrink-0">
                  {track.IndexNumber ?? idx + 1}
                </span>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{track.Name}</p>
                  {track.Artists && track.Artists.length > 0 && (
                    <p className="text-[10px] text-white/40 truncate">
                      {track.Artists.join(', ')}
                    </p>
                  )}
                </div>

                {/* Duration */}
                {track.RunTimeTicks && (
                  <span className="text-xs font-mono text-white/40 shrink-0">
                    {formatTime(ticksToSeconds(track.RunTimeTicks))}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Overview */}
      {album.Overview && (
        <section className={`rounded-[2rem] p-8 ${GLASS_PANEL}`}>
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
            {t('detail.album')}
          </h3>
          <p className="text-white/70 leading-relaxed text-sm font-light text-pretty">
            {album.Overview}
          </p>
        </section>
      )}
    </div>
  )
}
