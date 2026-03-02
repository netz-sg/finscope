import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play, Square, SkipForward } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useUIStore } from '../../store/useUIStore'
import { ticksToSeconds, formatTime } from '../../utils/time'
import { JellyfinAPI } from '../../api/jellyfin'
import CoverArt from './CoverArt'
import UserAvatar from './UserAvatar'
import type { Session } from '../../types/jellyfin'

export default function SessionCard({ session }: { session: Session }) {
  const { t } = useTranslation()
  const { config, isDemoMode } = useAppStore()
  const { setSelectedItem } = useUIStore()
  const [sending, setSending] = useState(false)

  const item = session.NowPlayingItem
  const playState = session.PlayState
  const isMusic = item.Type === 'Audio'
  const isPaused = playState.IsPaused

  const positionSec = ticksToSeconds(playState.PositionTicks)
  const durationSec = ticksToSeconds(item.RunTimeTicks)
  const progress = durationSec > 0 ? (positionSec / durationSec) * 100 : 0

  const isTranscode = playState.PlayMethod === 'Transcode'
  const videoCodec = item.MediaStreams?.find((s) => s.Type === 'Video')?.Codec
  const audioCodec = item.MediaStreams?.find((s) => s.Type === 'Audio')?.Codec

  const displayTitle =
    item.Type === 'Episode' && item.SeriesName
      ? item.SeriesName
      : item.Name

  const displaySubtitle =
    item.Type === 'Episode'
      ? `S${String(item.ParentIndexNumber ?? 0).padStart(2, '0')} E${String(item.IndexNumber ?? 0).padStart(2, '0')} — ${item.Name}`
      : item.Type === 'Audio' && item.Artists?.length
        ? item.Artists.join(', ')
        : item.ProductionYear
          ? String(item.ProductionYear)
          : ''

  const coverUrl = isDemoMode
    ? undefined
    : JellyfinAPI.getItemImageUrl(config.url, item.Id)
  const avatarUrl = isDemoMode
    ? undefined
    : JellyfinAPI.getUserImageUrl(config.url, session.UserId)

  const sendCommand = async (e: React.MouseEvent, command: 'Pause' | 'Unpause' | 'Stop' | 'NextTrack') => {
    e.stopPropagation()
    if (sending || isDemoMode) return
    setSending(true)
    try {
      await JellyfinAPI.sendPlaystateCommand(session.Id, command)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={() => setSelectedItem(item)}
      className="relative h-[160px] bg-[#121212] border border-white/5 rounded-[24px] shadow-xl flex items-center ml-8 transition-transform hover:scale-[1.02] duration-300 cursor-pointer"
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 -left-8 z-10 rounded-xl ${
          isMusic ? 'w-[140px] h-[140px]' : 'w-[130px] h-[180px]'
        }`}
      >
        <CoverArt
          url={coverUrl}
          title={item.Name}
          isDemo={isDemoMode}
          type={item.Type}
          className="w-full h-full !rounded-xl shadow-[8px_0_16px_rgba(0,0,0,0.6)] border border-white/10"
        />

        <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-[#121212] px-2.5 py-1 rounded-full border border-white/10 shadow-lg z-20">
          {isPaused ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[9px] font-bold tracking-wider text-amber-400">
                {t('radar.paused').toUpperCase()}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <span className="text-[9px] font-bold tracking-wider text-[#00e676]">LIVE</span>
            </>
          )}
        </div>
      </div>

      <div
        className={`w-full h-full pt-4 pb-3 pr-4 flex flex-col justify-between ${
          isMusic ? 'pl-[130px]' : 'pl-[120px]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar url={avatarUrl} name={session.UserName} className="w-6 h-6 text-[9px]" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#00e676] border-2 border-[#121212] rounded-full" />
            </div>
            <span className="text-xs font-bold text-white leading-tight truncate">
              {session.UserName}
            </span>
            <span className="text-[10px] text-neutral-500 uppercase flex items-center gap-1 shrink-0">
              <span className="w-1 h-1 bg-neutral-600 rounded-full inline-block" />
              {session.DeviceName}
            </span>
          </div>

          {!isDemoMode && (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => sendCommand(e, isPaused ? 'Unpause' : 'Pause')}
                disabled={sending}
                title={isPaused ? t('radar.control.resume') : t('radar.control.pause')}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all disabled:opacity-40"
              >
                {isPaused
                  ? <Play size={12} className="text-white/70 ml-0.5" />
                  : <Pause size={12} className="text-white/70" />
                }
              </button>
              {isMusic && (
                <button
                  onClick={(e) => sendCommand(e, 'NextTrack')}
                  disabled={sending}
                  title={t('radar.control.next')}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all disabled:opacity-40"
                >
                  <SkipForward size={12} className="text-white/70" />
                </button>
              )}
              <button
                onClick={(e) => sendCommand(e, 'Stop')}
                disabled={sending}
                title={t('radar.control.stop')}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/30 transition-all disabled:opacity-40"
              >
                <Square size={11} className="text-white/50 hover:text-red-400" />
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-bold text-white leading-tight mb-0.5 truncate">
            {displayTitle}
          </h3>
          {displaySubtitle && (
            <p className="text-[11px] text-neutral-400 font-medium truncate">
              {displaySubtitle}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-medium text-violet-400">
              {formatTime(positionSec)}
            </span>
            <span className="text-[10px] font-medium text-neutral-500">
              {formatTime(durationSec)}
            </span>
          </div>
          <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_#8b5cf6]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span
            className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${
              isTranscode
                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                : 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20'
            }`}
          >
            {isTranscode ? t('radar.transcoding') : t('radar.directPlay')}
          </span>
          {videoCodec && (
            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-white/5 text-neutral-400 border-white/5">
              {videoCodec.toUpperCase()}
            </span>
          )}
          {audioCodec && (
            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-white/5 text-neutral-400 border-white/5">
              {audioCodec.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
