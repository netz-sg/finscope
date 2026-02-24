import { useMemo } from 'react'
import { Zap, Server, Wifi, Radio, HardDrive, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useMediaStore } from '../../store/useMediaStore'
import { GLASS_PANEL, GLASS_PANEL_HOVER, GLASS_INNER } from '../../design/tokens'
import { SkeletonPanel } from '../ui/Skeleton'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return '—'
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PulseView() {
  const { t } = useTranslation()
  const serverInfo = useAppStore((s) => s.serverInfo)
  const sessions = useMediaStore((s) => s.sessions)
  const pulseStats = useMediaStore((s) => s.pulseStats)

  const bandwidth = useMemo(
    () => (sessions.length * 12.4).toFixed(1),
    [sessions.length],
  )

  const bars = useMemo(
    () => Array.from({ length: 25 }, () => 20 + Math.random() * 80),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions.length],
  )

  // Transcoding stats from live sessions
  const transcodeStats = useMemo(() => {
    const total = sessions.length
    const transcoding = sessions.filter((s) => s.PlayState.PlayMethod === 'Transcode').length
    const directPlay = total - transcoding
    const codecs = new Set<string>()
    sessions.forEach((s) => {
      s.NowPlayingItem.MediaStreams?.forEach((ms) => {
        if (ms.Codec) codecs.add(ms.Codec.toUpperCase())
      })
    })
    return {
      total,
      transcoding,
      directPlay,
      transcodePct: total > 0 ? Math.round((transcoding / total) * 100) : 0,
      directPlayPct: total > 0 ? Math.round((directPlay / total) * 100) : 0,
      codecs: Array.from(codecs).slice(0, 6),
    }
  }, [sessions])

  if (!serverInfo) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
            <Zap size={20} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t('pulse.title')}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonPanel lines={4} />
          <div className="lg:col-span-2"><SkeletonPanel lines={5} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonPanel lines={4} />
          <SkeletonPanel lines={4} />
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* ---------- Title ---------- */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
          <Zap size={20} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">{t('pulse.title')}</h2>
      </div>

      {/* ---------- Top row ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server info card */}
        <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <Server size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">
                {serverInfo.ServerName ?? 'Jellyfin'}
              </p>
              <p className="text-xs text-green-400/80 font-mono tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_6px_#4ade80] animate-pulse" />
                {t('pulse.onlineSyncing')}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl overflow-hidden ${GLASS_INNER}`}>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/[0.05]">
                  <td className="px-5 py-3 text-white/40 font-mono text-xs uppercase tracking-wider">
                    {t('pulse.version')}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {serverInfo.Version ?? '--'}
                  </td>
                </tr>
                <tr className="border-b border-white/[0.05]">
                  <td className="px-5 py-3 text-white/40 font-mono text-xs uppercase tracking-wider">
                    {t('pulse.os')}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {serverInfo.OperatingSystem ?? '--'}
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-white/40 font-mono text-xs uppercase tracking-wider">
                    {t('pulse.architecture')}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {serverInfo.SystemArchitecture ?? 'x64'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Network traffic card */}
        <div className={`lg:col-span-2 rounded-[2.5rem] p-8 ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Wifi size={18} className="text-cyan-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                {t('pulse.networkTraffic')}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              {t('pulse.optimal')}
            </span>
          </div>

          <p className="text-5xl font-black tracking-tight mb-1">
            {bandwidth}
            <span className="text-lg font-medium text-white/40 ml-2">Mbps</span>
          </p>
          <p className="text-xs text-white/30 font-mono mb-8">
            {sessions.length} stream{sessions.length !== 1 ? 's' : ''} &times; 12.4 Mbps avg
          </p>

          {/* Animated bar chart */}
          <div className="flex items-end gap-[3px] h-28">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/60 to-cyan-300/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Bottom row ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transcoding Overview */}
        <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Radio size={22} className="text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{t('pulse.transcodingOverview')}</p>
              <p className="text-xs text-white/40 font-mono">
                {transcodeStats.total > 0
                  ? `${transcodeStats.total} active session${transcodeStats.total !== 1 ? 's' : ''}`
                  : t('pulse.noActiveSessions')}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                {t('pulse.transcodeSessions')}
              </span>
              <span className="text-sm font-bold text-violet-400">
                {transcodeStats.transcoding} ({transcodeStats.transcodePct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${transcodeStats.transcodePct}%` }}
              />
            </div>
          </div>

          <div className={`rounded-2xl p-5 mt-3 ${GLASS_INNER}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                {t('pulse.directPlaySessions')}
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {transcodeStats.directPlay} ({transcodeStats.directPlayPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                style={{ width: `${transcodeStats.directPlayPct}%` }}
              />
            </div>
          </div>

          {/* Active codecs */}
          {transcodeStats.codecs.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                {t('pulse.codecsInUse')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {transcodeStats.codecs.map((codec) => (
                  <span
                    key={codec}
                    className="text-[10px] font-mono font-bold text-violet-300/70 bg-violet-400/10 px-2.5 py-1 rounded-lg border border-violet-400/15"
                  >
                    {codec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Playback Database */}
        <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL} ${GLASS_PANEL_HOVER}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <HardDrive size={22} className="text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{t('pulse.playbackDb')}</p>
              <p className="text-xs text-white/40 font-mono">FinScope SQLite</p>
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                {t('pulse.historyEntries')}
              </span>
              <span className="text-sm font-bold text-amber-400">
                {(pulseStats?.totalHistoryEntries ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                style={{ width: `${Math.min((pulseStats?.totalHistoryEntries ?? 0) / 50, 100)}%` }}
              />
            </div>
          </div>

          <div className={`rounded-2xl p-5 mt-3 ${GLASS_INNER}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                {t('pulse.dbSize')}
              </span>
              <span className="text-sm font-bold text-amber-400">
                {formatBytes(pulseStats?.dbSizeBytes ?? 0)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-orange-500/70 transition-all duration-700"
                style={{ width: `${Math.min((pulseStats?.dbSizeBytes ?? 0) / (100 * 1024 * 1024) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Last sync time */}
          <div className="mt-4 flex items-center gap-2">
            <Clock size={12} className="text-white/25" />
            <span className="text-[10px] font-mono text-white/30">
              {t('pulse.lastSync')}: {timeAgo(pulseStats?.lastSyncTime ?? null)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
