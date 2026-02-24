import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Star, Clock, AlignLeft, Activity, Disc3, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useUIStore } from '../../store/useUIStore'
import { JellyfinAPI } from '../../api/jellyfin'
import { GLASS_PANEL } from '../../design/tokens'
import { getMediaTypeConfig } from '../../utils/mediaTypes'
import { ticksToSeconds, formatTime } from '../../utils/time'
import { DEMO_DETAIL } from '../../utils/demo'
import CoverArt from '../ui/CoverArt'
import type { ItemDetail } from '../../types/jellyfin'

export default function ItemDetailOverlay() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { config, isDemoMode } = useAppStore()
  const { selectedItem, setSelectedItem } = useUIStore()
  const [detail, setDetail] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedItem) return
    setLoading(true)

    if (isDemoMode) {
      const timer = setTimeout(() => {
        setDetail({
          ...DEMO_DETAIL,
          Name: selectedItem.Name,
          Type: selectedItem.Type || 'Movie',
          Id: selectedItem.Id,
        })
        setLoading(false)
      }, 400)
      return () => clearTimeout(timer)
    }

    JellyfinAPI.getItemDetail(config.url, config.apiKey, config.userId, selectedItem.Id)
      .then((data) => setDetail(data || (selectedItem as unknown as ItemDetail)))
      .catch(() => setDetail(selectedItem as unknown as ItemDetail))
      .finally(() => setLoading(false))
  }, [selectedItem, config, isDemoMode])

  if (!selectedItem) return null

  const typeConf = getMediaTypeConfig(detail?.Type || selectedItem.Type)
  const TypeIcon = typeConf.icon
  const isMusic = detail?.Type === 'Audio' || detail?.Type === 'MusicAlbum'
  const backdropUrl = isDemoMode
    ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1920'
    : JellyfinAPI.getItemImageUrl(config.url, selectedItem.Id, 'Backdrop')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-zoom-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-2xl transition-opacity"
        onClick={() => setSelectedItem(null)}
      />

      {backdropUrl && (
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen">
          <img src={backdropUrl} className="w-full h-full object-cover blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      <div
        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto hide-scrollbar rounded-[3rem] p-8 sm:p-12 flex flex-col md:flex-row gap-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] ${GLASS_PANEL}`}
      >
        <button
          onClick={() => setSelectedItem(null)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all z-50"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <Activity className="animate-pulse text-white/30" size={40} />
          </div>
        ) : (
          <>
            <div className="w-full md:w-1/3 shrink-0 flex flex-col items-center">
              <CoverArt
                url={JellyfinAPI.getItemImageUrl(config.url, detail!.Id, 'Primary')}
                title={detail!.Name}
                type={detail!.Type}
                isDemo={isDemoMode}
                className={`w-full ${isMusic ? 'aspect-square' : 'aspect-2/3'} rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10`}
              />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}
                >
                  <TypeIcon size={12} className="mr-1.5" /> {typeConf.label}
                </span>
                {detail!.ProductionYear && (
                  <span className="text-sm font-mono text-white/50">{detail!.ProductionYear}</span>
                )}
                {!isMusic && detail!.OfficialRating && (
                  <span className="border border-white/20 text-white/60 px-2 py-0.5 rounded text-[10px] font-bold">
                    {detail!.OfficialRating}
                  </span>
                )}
              </div>

              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none mb-6 drop-shadow-xl text-balance">
                {detail!.Name}
              </h2>

              {isMusic ? (
                /* ── Music-specific content ── */
                <>
                  {/* Artist(s) */}
                  {detail!.ArtistItems && detail!.ArtistItems.length > 0 ? (
                    <div className="flex items-center gap-2 mb-4">
                      <User size={14} className="text-white/30 shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {detail!.ArtistItems.map((artist) => (
                          <button
                            key={artist.Id}
                            onClick={() => {
                              setSelectedItem(null)
                              navigate(`/artist/${artist.Id}`)
                            }}
                            className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
                          >
                            {artist.Name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : detail!.Artists && detail!.Artists.length > 0 ? (
                    <div className="flex items-center gap-2 mb-4">
                      <User size={14} className="text-white/30 shrink-0" />
                      <p className="text-sm text-white/60">{detail!.Artists.join(', ')}</p>
                    </div>
                  ) : null}

                  {/* Album */}
                  {detail!.Album && (
                    <div className="flex items-center gap-2 mb-4">
                      <Disc3 size={14} className="text-white/30 shrink-0" />
                      {detail!.AlbumId ? (
                        <button
                          onClick={() => {
                            setSelectedItem(null)
                            navigate(`/album/${detail!.AlbumId}`)
                          }}
                          className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
                        >
                          {detail!.Album}
                        </button>
                      ) : (
                        <p className="text-sm text-white/60">{detail!.Album}</p>
                      )}
                    </div>
                  )}

                  {/* Track / Disc number + Duration */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    {detail!.ParentIndexNumber && (
                      <div className="flex items-center gap-1.5 text-white/60 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        {t('detail.discNumber', { number: detail!.ParentIndexNumber })}
                      </div>
                    )}
                    {detail!.IndexNumber && (
                      <div className="flex items-center gap-1.5 text-white/60 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        {t('detail.trackNumber', { number: detail!.IndexNumber })}
                      </div>
                    )}
                    {detail!.RunTimeTicks && (
                      <div className="flex items-center gap-1.5 text-white/60 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Clock size={16} /> {formatTime(ticksToSeconds(detail!.RunTimeTicks))}
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {detail!.Genres && detail!.Genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {detail!.Genres.map((g) => (
                        <span
                          key={g}
                          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Overview — only if actually present */}
                  {detail!.Overview && (
                    <div className="mb-8">
                      <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlignLeft size={14} /> {t('detail.biography')}
                      </h3>
                      <p className="text-white/70 leading-relaxed text-sm md:text-base font-light text-pretty">
                        {detail!.Overview}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* ── Movie / Series / Episode content ── */
                <>
                  <div className="flex flex-wrap gap-4 mb-8">
                    {detail!.CommunityRating && detail!.CommunityRating > 0 && (
                      <div className="flex items-center gap-1.5 text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                        <Star size={16} className="fill-yellow-400" />{' '}
                        {detail!.CommunityRating.toFixed(1)}
                      </div>
                    )}
                    {detail!.RunTimeTicks && (
                      <div className="flex items-center gap-1.5 text-white/60 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Clock size={16} /> {formatTime(ticksToSeconds(detail!.RunTimeTicks))}
                      </div>
                    )}
                  </div>

                  {detail!.Genres && detail!.Genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {detail!.Genres.map((g) => (
                        <span
                          key={g}
                          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlignLeft size={14} /> {t('detail.plot')}
                    </h3>
                    <p className="text-white/70 leading-relaxed text-sm md:text-base font-light text-pretty">
                      {detail!.Overview || t('detail.noDescription')}
                    </p>
                  </div>

                  {detail!.Studios && detail!.Studios.length > 0 && (
                    <div className="mt-auto border-t border-white/10 pt-6">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                        {t('detail.production')}
                      </p>
                      <p className="text-sm text-white/60">
                        {detail!.Studios.map((s) => s.Name).join(' \u2022 ')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
