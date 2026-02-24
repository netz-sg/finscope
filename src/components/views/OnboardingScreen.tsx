import { useState, useEffect, type FormEvent } from 'react'
import {
  User, Server, ArrowRight, ArrowLeft, Check, Eye, EyeOff, Loader2,
  Film, Tv, Music, Clapperboard,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useUIStore } from '../../store/useUIStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'
import i18n from '../../i18n'

type Step = 'language' | 'welcome' | 'radar' | 'analytics' | 'library' | 'users' | 'pulse' | 'account' | 'jellyfin'

interface Props {
  isRerun?: boolean
}

/* ───────────────────────── Mockup Components ───────────────────────── */

function MockSessionCard({
  title,
  subtitle,
  username,
  device,
  progress,
  posTime,
  durTime,
  isTranscode,
  videoCodec,
  audioCodec,
  isPaused,
  coverIcon: CoverIcon,
  coverFrom,
  coverVia,
  coverTo,
}: {
  title: string
  subtitle?: string
  username: string
  device: string
  progress: number
  posTime: string
  durTime: string
  isTranscode: boolean
  videoCodec: string
  audioCodec: string
  isPaused?: boolean
  coverIcon: typeof Film
  coverFrom: string
  coverVia: string
  coverTo: string
}) {
  return (
    <div className="flex items-center gap-0">
      {/* Floating cover — sits outside the card, overlapping it */}
      <div className="relative z-10 shrink-0 -mr-4">
        <div
          className="w-[100px] h-[140px] rounded-xl border border-white/15 shadow-[8px_0_20px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${coverFrom}, ${coverVia}, ${coverTo})` }}
        >
          <CoverIcon size={36} className="text-white/30" />
        </div>
        {/* LIVE / PAUSED badge */}
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-full border border-white/10 shadow-lg">
          {isPaused ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[8px] font-bold tracking-wider text-amber-400">PAUSED</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
              <span className="text-[8px] font-bold tracking-wider text-[#00e676]">LIVE</span>
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0 h-[148px] bg-[#121212] border border-white/5 rounded-r-[20px] rounded-l-lg shadow-xl pl-6 pr-5 py-3.5 flex flex-col justify-between">
        {/* User row */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{username[0].toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#00e676] border-2 border-[#121212] rounded-full" />
          </div>
          <span className="text-xs font-bold text-white truncate">{username}</span>
          <span className="text-[10px] text-neutral-500 uppercase flex items-center gap-1 shrink-0">
            <span className="w-1 h-1 bg-neutral-600 rounded-full inline-block" />
            {device}
          </span>
        </div>

        {/* Title */}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white leading-tight mb-0.5 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-neutral-400 font-medium truncate">{subtitle}</p>}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-medium text-violet-400">{posTime}</span>
            <span className="text-[10px] font-medium text-neutral-500">{durTime}</span>
          </div>
          <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full shadow-[0_0_10px_#8b5cf6]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tech badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${
            isTranscode
              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              : 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20'
          }`}>
            {isTranscode ? 'Transcode' : 'Direct Play'}
          </span>
          <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-white/5 text-neutral-400 border-white/5">
            {videoCodec}
          </span>
          <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-white/5 text-neutral-400 border-white/5">
            {audioCodec}
          </span>
        </div>
      </div>
    </div>
  )
}

function MockRadar() {
  return (
    <div className="space-y-5">
      {/* Session 1: Movie — Direct Play, LIVE */}
      <MockSessionCard
        title="Interstellar"
        subtitle="2014"
        username="admin"
        device="Apple TV"
        progress={68}
        posTime="1:52:14"
        durTime="2:49:00"
        isTranscode={false}
        videoCodec="H.264"
        audioCodec="AAC"
        coverIcon={Film}
        coverFrom="#1e3a5f"
        coverVia="#2d4a7c"
        coverTo="#0f1b2d"
      />

      {/* Session 2: Episode — Transcode, LIVE */}
      <MockSessionCard
        title="Breaking Bad"
        subtitle="S05 E14 — Ozymandias"
        username="sarah"
        device="Chrome"
        progress={34}
        posTime="0:18:42"
        durTime="0:47:12"
        isTranscode={true}
        videoCodec="HEVC"
        audioCodec="EAC3"
        coverIcon={Tv}
        coverFrom="#4a1d6a"
        coverVia="#6b3fa0"
        coverTo="#1a0a2e"
      />

      {/* Session 3: Music — Direct Play, PAUSED */}
      <MockSessionCard
        title="Bohemian Rhapsody"
        subtitle="Queen"
        username="tom"
        device="Web Player"
        progress={45}
        posTime="2:41"
        durTime="5:55"
        isTranscode={false}
        videoCodec="FLAC"
        audioCodec="FLAC"
        isPaused
        coverIcon={Music}
        coverFrom="#6b1d3a"
        coverVia="#a03f6b"
        coverTo="#2e0a1a"
      />
    </div>
  )
}

function MockAnalytics() {
  const heatmapData = [
    [0,1,0,2,1,0,3],[0,2,3,1,0,1,2],[1,0,2,3,2,1,0],[3,2,1,0,1,3,2],
    [0,1,3,2,0,1,0],[2,3,0,1,2,0,3],[1,0,2,0,3,2,1],
  ]
  const heatColors = ['bg-white/[0.03]', 'bg-green-900/60', 'bg-green-600/70', 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.4)]']
  const primeHours = [1,2,3,2,1,0,0,1,2,3,4,5,4,3,5,6,8,10,9,12,14,11,7,3]

  return (
    <div className="space-y-3">
      {/* Heatmap */}
      <div className={`rounded-[2rem] p-5 ${GLASS_PANEL}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Activity Heatmap</p>
        <div className="flex gap-[3px]">
          {heatmapData.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px] flex-1">
              {col.map((v, ri) => (
                <div key={ri} className={`aspect-square rounded-[3px] ${heatColors[v]}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Prime Time */}
      <div className={`rounded-[2rem] p-5 ${GLASS_PANEL}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Prime-Time</p>
        <div className="flex items-end gap-[3px] h-16">
          {primeHours.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className={`rounded-t-sm ${i === 19 ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/[0.08]'}`}
                style={{ height: `${(v / 14) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[8px] text-white/20 font-mono">0:00</span>
          <span className="text-[8px] text-white/20 font-mono">12:00</span>
          <span className="text-[8px] text-white/20 font-mono">23:00</span>
        </div>
      </div>
    </div>
  )
}

function MockLibrary() {
  const stats = [
    { icon: Film, count: '847', label: 'Movies', color: 'text-blue-400', bg: 'bg-blue-400/15' },
    { icon: Tv, count: '92', label: 'Series', color: 'text-purple-400', bg: 'bg-purple-400/15' },
    { icon: Clapperboard, count: '4,231', label: 'Episodes', color: 'text-emerald-400', bg: 'bg-emerald-400/15' },
    { icon: Music, count: '12.4k', label: 'Songs', color: 'text-pink-400', bg: 'bg-pink-400/15' },
  ]
  const genres = [
    { name: 'Action', pct: 82, color: 'bg-blue-400' },
    { name: 'Drama', pct: 65, color: 'bg-purple-400' },
    { name: 'Sci-Fi', pct: 48, color: 'bg-emerald-400' },
    { name: 'Comedy', pct: 37, color: 'bg-amber-400' },
    { name: 'Horror', pct: 21, color: 'bg-pink-400' },
  ]

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${GLASS_PANEL}`}>
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-xl font-black text-white/90">{s.count}</p>
            <p className="text-[9px] uppercase tracking-widest text-white/30">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Genre Breakdown */}
      <div className={`rounded-[2rem] p-5 ${GLASS_PANEL}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Genre Distribution</p>
        <div className="space-y-2.5">
          {genres.map((g) => (
            <div key={g.name} className="flex items-center gap-3">
              <span className="text-[10px] text-white/50 w-12">{g.name}</span>
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockUsers() {
  const users = [
    { name: 'admin', status: 'live', item: 'Interstellar', color: 'bg-emerald-400', ring: 'ring-emerald-400/30', text: 'text-emerald-400', glow: 'from-emerald-500/10' },
    { name: 'sarah', status: 'online', item: null, color: 'bg-sky-400', ring: 'ring-sky-400/30', text: 'text-sky-400', glow: '' },
    { name: 'tom', status: 'offline', item: null, color: 'bg-white/20', ring: 'ring-transparent', text: 'text-white/40', glow: '' },
  ]

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.name} className={`rounded-2xl p-5 ${GLASS_PANEL} ${u.glow ? `bg-gradient-to-r ${u.glow} to-transparent` : ''}`}>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ring-2 ${u.ring}`}>
                <User size={20} className="text-white/40" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] ${u.color}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white/90">{u.name}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${u.text}`}>{u.status}</p>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="text-lg font-black text-white/80">{u.status === 'live' ? '24' : u.status === 'online' ? '18' : '3'}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Plays</p>
            </div>
          </div>

          {/* Live mini player */}
          {u.item && (
            <div className={`mt-3 rounded-xl p-3 flex items-center gap-3 ${GLASS_INNER} ring-1 ring-emerald-400/10`}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Film size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white/80 truncate">{u.item}</p>
                <div className="h-1 bg-black/30 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full w-[68%] bg-blue-500 rounded-full" />
                </div>
              </div>
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MockPulse() {
  const bars = [4,6,3,8,5,7,9,6,4,7,10,8,5,3,6,8]

  return (
    <div className="space-y-3">
      {/* Server Info */}
      <div className={`rounded-[2rem] p-5 ${GLASS_PANEL}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <Server size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">FinScope Server</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
              <span className="text-[10px] text-green-400/70 font-medium">Online &amp; Syncing</span>
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-3 space-y-2 ${GLASS_INNER}`}>
          {[['Version', '10.10.3'], ['OS', 'Linux 6.1'], ['Architecture', 'x64']].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-[10px] text-white/30">{k}</span>
              <span className="text-[10px] font-mono text-white/60">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Network */}
      <div className={`rounded-[2rem] p-5 ${GLASS_PANEL}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Network Traffic</p>
        <div className="flex items-end gap-[3px] h-14 mb-2">
          {bars.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div className="rounded-t-sm bg-gradient-to-t from-cyan-500/60 to-cyan-300/30" style={{ height: `${(v / 10) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white/90">24.7</span>
          <span className="text-[10px] text-white/30 font-mono">Mbit/s</span>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-md bg-green-400/10 text-green-400 border border-green-400/20">Optimal</span>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Main Component ───────────────────────── */

export default function OnboardingScreen({ isRerun = false }: Props) {
  const { t } = useTranslation()
  const { register, saveJellyfinConfig, user } = useAppStore()
  const setShowOnboardingTour = useUIStore((s) => s.setShowOnboardingTour)

  const featureSteps: Step[] = ['radar', 'analytics', 'library', 'users', 'pulse']

  const steps: Step[] = isRerun
    ? ['language', 'welcome', ...featureSteps]
    : user
      ? ['jellyfin']
      : ['language', 'welcome', ...featureSteps, 'account', 'jellyfin']

  const [step, setStep] = useState<Step>(steps[0])
  const [visible, setVisible] = useState(true)
  const [mockVisible, setMockVisible] = useState(false)

  // Account form
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountLoading, setAccountLoading] = useState(false)

  // Jellyfin form
  const [serverUrl, setServerUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [jellyfinError, setJellyfinError] = useState('')
  const [jellyfinLoading, setJellyfinLoading] = useState(false)

  const currentIndex = steps.indexOf(step)
  const isFeatureStep = featureSteps.includes(step)

  const goToStep = (next: Step) => {
    setVisible(false)
    setMockVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 300)
  }

  // Staggered mockup animation
  useEffect(() => {
    if (visible && (isFeatureStep || step === 'welcome')) {
      const timer = setTimeout(() => setMockVisible(true), 200)
      return () => clearTimeout(timer)
    }
  }, [step, visible, isFeatureStep])

  const goNext = () => {
    const nextIdx = currentIndex + 1
    if (nextIdx < steps.length) goToStep(steps[nextIdx])
  }

  const goPrev = () => {
    const prevIdx = currentIndex - 1
    if (prevIdx >= 0) goToStep(steps[prevIdx])
  }

  const handleLanguageSelect = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('finscope_lang', lang)
    goNext()
  }

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault()
    setAccountError('')
    if (username.trim().length < 3) { setAccountError(t('onboarding.usernameMin')); return }
    if (password.length < 6) { setAccountError(t('onboarding.passwordMin')); return }
    if (password !== confirmPassword) { setAccountError(t('onboarding.passwordMismatch')); return }

    setAccountLoading(true)
    try {
      await register(username.trim(), password)
      goToStep('jellyfin')
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleConnectJellyfin = async (e: FormEvent) => {
    e.preventDefault()
    setJellyfinError('')
    if (!serverUrl.trim()) { setJellyfinError(t('onboarding.serverUrlRequired')); return }
    if (!apiKey.trim()) { setJellyfinError(t('onboarding.apiKeyRequired')); return }

    setJellyfinLoading(true)
    try {
      const result = await saveJellyfinConfig(serverUrl.trim(), apiKey.trim())
      if (!result.success) {
        setJellyfinError(result.error || t('onboarding.connectionFailed'))
      }
    } catch (err) {
      setJellyfinError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setJellyfinLoading(false)
    }
  }

  const featureMeta: Record<string, { title: string; desc: string; mock: () => React.ReactNode }> = {
    radar: { title: t('onboarding.featureRadar'), desc: t('onboarding.featureRadarDesc'), mock: MockRadar },
    analytics: { title: t('onboarding.featureAnalytics'), desc: t('onboarding.featureAnalyticsDesc'), mock: MockAnalytics },
    library: { title: t('onboarding.featureLibrary'), desc: t('onboarding.featureLibraryDesc'), mock: MockLibrary },
    users: { title: t('onboarding.featureUsers'), desc: t('onboarding.featureUsersDesc'), mock: MockUsers },
    pulse: { title: t('onboarding.featurePulse'), desc: t('onboarding.featurePulseDesc'), mock: MockPulse },
  }

  const inputClass = `w-full rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono text-sm ${GLASS_INNER}`
  const currentLang = i18n.language

  const isLastFeature = step === featureSteps[featureSteps.length - 1]

  // Nav buttons for feature & welcome pages
  const NavButtons = ({ nextLabel, onNext }: { nextLabel: string; onNext: () => void }) => (
    <div className="flex gap-3 max-w-sm mx-auto mt-8">
      <button
        onClick={goPrev}
        className={`flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={onNext}
        className={`flex-1 flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] ${TRANSITION}`}
      >
        {nextLabel}
        <ArrowRight size={18} />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/15 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Content */}
      <div
        className={`w-full max-w-3xl z-10 transition-all duration-300 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >

        {/* ─── Language ─── */}
        {step === 'language' && (
          <div className="flex flex-col items-center text-center">
            <img src="/logo_finscope.png" alt="FinScope" className="h-20 sm:h-24 mb-10 drop-shadow-[0_0_40px_rgba(99,102,241,0.3)]" />
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-14">{t('app.subtitle')}</p>
            <p className="text-white/50 text-sm mb-8">Choose your language / Wähle deine Sprache</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {(['de', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className={`flex flex-col items-center gap-3 py-10 rounded-3xl cursor-pointer ${GLASS_PANEL} hover:bg-white/[0.08] hover:-translate-y-1 ${
                    currentLang === lang ? 'ring-1 ring-white/30 bg-white/[0.06]' : ''
                  }`}
                >
                  <span className="text-4xl font-black tracking-tight">{lang.toUpperCase()}</span>
                  <span className="text-xs text-white/40 font-medium tracking-wide">{lang === 'de' ? 'Deutsch' : 'English'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Welcome ─── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center">
            <img src="/logo_finscope.png" alt="FinScope" className="h-16 sm:h-20 mb-8 drop-shadow-[0_0_40px_rgba(99,102,241,0.3)]" />
            {isRerun && (
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-3">{t('onboarding.welcomeBack')}</h2>
            )}
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-10">{t('app.subtitle')}</p>
            <div className={`rounded-3xl p-8 mb-2 w-full max-w-lg transition-all duration-500 ease-out ${GLASS_PANEL} ${mockVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-sm text-white/50 leading-relaxed">{t('onboarding.welcomeText')}</p>
            </div>
            {/* Single continue button — no back to language */}
            <div className="max-w-sm mx-auto mt-8 w-full">
              <button
                onClick={goNext}
                className={`w-full flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] ${TRANSITION}`}
              >
                {t('onboarding.continue')}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Feature Pages ─── */}
        {isFeatureStep && featureMeta[step] && (() => {
          const meta = featureMeta[step]
          const MockComponent = meta.mock
          return (
            <div>
              {/* Title */}
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{meta.title}</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto">{meta.desc}</p>
              </div>

              {/* Mockup Preview */}
              <div className={`max-w-md mx-auto transition-all duration-500 ease-out ${mockVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97]'}`}>
                <MockComponent />
              </div>

              {/* Nav */}
              <NavButtons
                nextLabel={
                  isLastFeature
                    ? isRerun ? t('onboarding.finishTour') : t('onboarding.letsGo')
                    : t('onboarding.continue')
                }
                onNext={() => {
                  if (isLastFeature && isRerun) {
                    setShowOnboardingTour(false)
                  } else {
                    goNext()
                  }
                }}
              />
            </div>
          )
        })()}

        {/* ─── Account ─── */}
        {step === 'account' && (
          <div className={`rounded-[3rem] p-8 sm:p-10 max-w-lg mx-auto ${GLASS_PANEL}`}>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <User size={28} className="text-white/70" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('onboarding.createAccount')}</h2>
              <p className="text-white/40 text-xs mt-2">{t('onboarding.createAccountSub')}</p>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{t('onboarding.username')}</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('onboarding.usernamePlaceholder')} className={inputClass} autoComplete="username" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{t('onboarding.password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{t('onboarding.confirmPassword')}</label>
                <input type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} autoComplete="new-password" />
              </div>
              {accountError && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3">
                  <p className="text-red-400 text-xs text-center">{accountError}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goPrev}
                  className={`flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}>
                  <ArrowLeft size={16} />
                </button>
                <button type="submit" disabled={accountLoading}
                  className={`flex-1 flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 ${TRANSITION}`}>
                  {accountLoading ? <Loader2 size={18} className="animate-spin" /> : <>{t('onboarding.createAccountBtn')}<ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Jellyfin ─── */}
        {step === 'jellyfin' && (
          <div className={`rounded-[3rem] p-8 sm:p-10 max-w-lg mx-auto ${GLASS_PANEL}`}>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <Server size={28} className="text-white/70" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('onboarding.connectJellyfin')}</h2>
              <p className="text-white/40 text-xs mt-2">{t('onboarding.connectJellyfinSub')}</p>
            </div>
            <form onSubmit={handleConnectJellyfin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{t('onboarding.serverUrl')}</label>
                <input type="text" required value={serverUrl} onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://jellyfin.example.com" className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{t('onboarding.apiKey')}</label>
                <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('onboarding.apiKeyPlaceholder')} className={inputClass} />
              </div>
              <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                <p className="text-[11px] text-white/35 leading-relaxed">{t('onboarding.apiKeyHint')}</p>
              </div>
              {jellyfinError && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3">
                  <p className="text-red-400 text-xs text-center">{jellyfinError}</p>
                </div>
              )}
              <button type="submit" disabled={jellyfinLoading}
                className={`w-full flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 mt-2 ${TRANSITION}`}>
                {jellyfinLoading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} />{t('onboarding.connectBtn')}</>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ─── Step Indicators ─── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex
                ? 'w-8 bg-white'
                : i < currentIndex
                  ? 'w-3 bg-white/40'
                  : 'w-3 bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
