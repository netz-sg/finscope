import { useEffect, useState, useRef, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X, Play, Square, Zap, AlertTriangle } from 'lucide-react'
import { useToastStore, type Toast } from '../../store/useToastStore'
import { JellyfinAPI } from '../../api/jellyfin'
import { useAppStore } from '../../store/useAppStore'
import { GLASS_PANEL, TRANSITION } from '../../design/tokens'

const SIMPLE_ICON_MAP = {
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
}

const EVENT_CONFIG: Record<string, { icon: typeof Play; color: string; dotColor: string; label: string }> = {
  stream_start: { icon: Play, color: 'text-emerald-400', dotColor: 'bg-emerald-400', label: 'LIVE' },
  stream_end: { icon: Square, color: 'text-indigo-400', dotColor: 'bg-indigo-400', label: 'ENDED' },
  transcode_load: { icon: Zap, color: 'text-amber-400', dotColor: 'bg-amber-400', label: 'TRANSCODE' },
  concurrent_threshold: { icon: AlertTriangle, color: 'text-red-400', dotColor: 'bg-red-400', label: 'ALERT' },
  server_error: { icon: AlertTriangle, color: 'text-red-400', dotColor: 'bg-red-400', label: 'ERROR' },
}

const FALLBACK_VIDEO = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900'
const FALLBACK_AUDIO = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600&h=600'

function useNavWidth() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const nav = document.querySelector('[data-bottom-nav]')
    if (!nav) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width + 2)
      }
    })
    ro.observe(nav)
    setWidth(nav.getBoundingClientRect().width)

    return () => ro.disconnect()
  }, [])

  return width
}

function CoverImage({ itemId, itemType }: { itemId?: string; itemType?: string }) {
  const [error, setError] = useState(false)
  const config = useAppStore((s) => s.config)
  const isAudio = itemType === 'Audio' || itemType === 'MusicAlbum'
  const fallback = isAudio ? FALLBACK_AUDIO : FALLBACK_VIDEO

  const url = !error && itemId
    ? JellyfinAPI.getItemImageUrl(config.url, itemId)
    : fallback

  return (
    <img
      src={url}
      alt=""
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  )
}

function StreamToast({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const meta = t.meta
  const eventCfg = EVENT_CONFIG[t.eventType || ''] || EVENT_CONFIG.stream_start
  const isAudio = meta?.itemType === 'Audio' || meta?.itemType === 'MusicAlbum'

  const displayTitle = meta?.itemType === 'Episode' && meta?.seriesName
    ? meta.seriesName
    : isAudio && meta?.artists?.length
      ? meta.artists[0]
      : t.message.split(' started watching ')[1] || t.message.split(' ended')[0] || t.message

  const displaySubtitle = meta?.itemType === 'Episode' && meta?.seriesName
    ? `S${String(meta.parentIndexNumber ?? 0).padStart(2, '0')}E${String(meta.indexNumber ?? 0).padStart(2, '0')}`
    : isAudio && meta?.album
      ? meta.album
      : undefined

  const userName = meta?.userName || t.message.split(' started ')[0] || ''

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    const fadeTimer = setTimeout(() => setVisible(false), t.duration - 500)
    return () => clearTimeout(fadeTimer)
  }, [t.duration])

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${t.duration - 200}ms linear`
      requestAnimationFrame(() => {
        if (progressRef.current) progressRef.current.style.width = '0%'
      })
    }
  }, [t.duration])

  return (
    <div
      className={`relative w-full ${TRANSITION} ${
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-6 opacity-0 scale-95'
      }`}
    >
      <div className={`relative ${isAudio ? 'ml-[52px] sm:ml-[60px]' : 'ml-[44px] sm:ml-[50px]'}`}>
        <div className={`${GLASS_PANEL} rounded-2xl overflow-hidden border-white/[0.12]`}>
          <div className={`flex items-center gap-3 py-3.5 sm:py-4 pr-3 ${isAudio ? 'pl-[56px] sm:pl-[64px]' : 'pl-[48px] sm:pl-[56px]'} min-h-[80px] sm:min-h-[88px]`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${eventCfg.dotColor} ${t.eventType === 'stream_start' ? 'animate-pulse' : ''} shrink-0`} />
                <span className={`text-[9px] sm:text-[10px] font-black tracking-[0.15em] uppercase ${eventCfg.color}`}>
                  {eventCfg.label}
                </span>
                {userName && (
                  <>
                    <span className="text-white/10 text-[9px]">·</span>
                    <span className="text-[10px] sm:text-[11px] text-white/35 font-medium truncate">{userName}</span>
                  </>
                )}
              </div>
              <p className="text-sm sm:text-[15px] font-bold text-white/90 leading-tight truncate">
                {displayTitle}
              </p>
              {displaySubtitle && (
                <p className="text-[11px] sm:text-xs text-white/40 font-medium truncate mt-0.5">
                  {displaySubtitle}
                </p>
              )}
            </div>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
          <div className="h-[2px] bg-white/[0.03]">
            <div
              ref={progressRef}
              className={`h-full w-full ${
                t.eventType === 'stream_start' ? 'bg-emerald-400/40'
                  : t.eventType === 'stream_end' ? 'bg-indigo-400/40'
                    : t.eventType === 'transcode_load' ? 'bg-amber-400/40'
                      : 'bg-red-400/40'
              }`}
            />
          </div>
        </div>
      </div>

      <div className={`absolute top-1/2 -translate-y-1/2 left-0 z-10 ${
        isAudio
          ? 'w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-xl'
          : 'w-[80px] h-[112px] sm:w-[92px] sm:h-[130px] rounded-lg'
      } overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.6),0_0_48px_rgba(0,0,0,0.4)] border border-white/[0.12] bg-neutral-900`}>
        <CoverImage itemId={meta?.itemId} itemType={meta?.itemType} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

function SimpleToast({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const cfg = SIMPLE_ICON_MAP[t.type as keyof typeof SIMPLE_ICON_MAP]
  const Icon = cfg?.icon || Info

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const fadeTimer = setTimeout(() => setVisible(false), t.duration - 400)
    return () => clearTimeout(fadeTimer)
  }, [t.duration])

  return (
    <div
      className={`${GLASS_PANEL} rounded-2xl p-3.5 pr-3 flex items-center gap-3 border ${cfg?.border || 'border-sky-400/20'} w-full ${TRANSITION} ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl ${cfg?.bg || 'bg-sky-400/10'} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={cfg?.color || 'text-sky-400'} />
      </div>
      <p className="text-[13px] sm:text-sm font-medium text-white/90 flex-1 leading-snug truncate">{t.message}</p>
      <button
        onClick={onDismiss}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const navWidth = useNavWidth()

  if (toasts.length === 0 || navWidth === 0) return null

  return (
    <div
      className="fixed bottom-[96px] sm:bottom-[110px] md:bottom-[124px] left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-3 pointer-events-auto"
      style={{ width: navWidth }}
    >
      {toasts.map((t) =>
        t.type === 'stream' ? (
          <StreamToast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ) : (
          <SimpleToast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ),
      )}
    </div>
  )
}
