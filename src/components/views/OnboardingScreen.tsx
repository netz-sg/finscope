import { useState, type FormEvent } from 'react'
import { Radio, User, Server, ArrowRight, ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'

type Step = 'welcome' | 'account' | 'jellyfin'

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const { register, saveJellyfinConfig, user } = useAppStore()

  const [step, setStep] = useState<Step>(user ? 'jellyfin' : 'welcome')

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

  const steps: Step[] = ['welcome', 'account', 'jellyfin']
  const currentIndex = steps.indexOf(step)

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault()
    setAccountError('')

    if (username.trim().length < 3) {
      setAccountError(t('onboarding.usernameMin'))
      return
    }
    if (password.length < 6) {
      setAccountError(t('onboarding.passwordMin'))
      return
    }
    if (password !== confirmPassword) {
      setAccountError(t('onboarding.passwordMismatch'))
      return
    }

    setAccountLoading(true)
    try {
      await register(username.trim(), password)
      setStep('jellyfin')
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleConnectJellyfin = async (e: FormEvent) => {
    e.preventDefault()
    setJellyfinError('')

    if (!serverUrl.trim()) {
      setJellyfinError(t('onboarding.serverUrlRequired'))
      return
    }
    if (!apiKey.trim()) {
      setJellyfinError(t('onboarding.apiKeyRequired'))
      return
    }

    setJellyfinLoading(true)
    try {
      const result = await saveJellyfinConfig(serverUrl.trim(), apiKey.trim())
      if (!result.success) {
        setJellyfinError(result.error || t('onboarding.connectionFailed'))
      }
      // On success, saveJellyfinConfig sets phase to 'authenticated' automatically
    } catch (err) {
      setJellyfinError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setJellyfinLoading(false)
    }
  }

  const inputClass = `w-full rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono text-sm ${GLASS_INNER}`

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/15 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className={`w-full max-w-lg z-10 rounded-4xl sm:rounded-[3rem] p-8 sm:p-10 ${GLASS_PANEL}`}>
        {/* ─── Welcome Step ─── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(255,255,255,0.2)]">
              <Radio size={40} />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3">FINSCOPE</h1>
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-8">
              {t('app.subtitle')}
            </p>

            <div className={`rounded-2xl p-6 mb-8 w-full ${GLASS_INNER}`}>
              <p className="text-sm text-white/50 leading-relaxed">
                {t('onboarding.welcomeText')}
              </p>
            </div>

            <button
              onClick={() => setStep('account')}
              className={`w-full flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] ${TRANSITION}`}
            >
              {t('onboarding.getStarted')}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ─── Account Step ─── */}
        {step === 'account' && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <User size={28} className="text-white/70" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('onboarding.createAccount')}</h2>
              <p className="text-white/40 text-xs mt-2">{t('onboarding.createAccountSub')}</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  {t('onboarding.username')}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('onboarding.usernamePlaceholder')}
                  className={inputClass}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  {t('onboarding.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  {t('onboarding.confirmPassword')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>

              {accountError && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3">
                  <p className="text-red-400 text-xs text-center">{accountError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="submit"
                  disabled={accountLoading}
                  className={`flex-1 flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 ${TRANSITION}`}
                >
                  {accountLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {t('onboarding.createAccountBtn')}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Jellyfin Step ─── */}
        {step === 'jellyfin' && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <Server size={28} className="text-white/70" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{t('onboarding.connectJellyfin')}</h2>
              <p className="text-white/40 text-xs mt-2">{t('onboarding.connectJellyfinSub')}</p>
            </div>

            <form onSubmit={handleConnectJellyfin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  {t('onboarding.serverUrl')}
                </label>
                <input
                  type="text"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://jellyfin.example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  {t('onboarding.apiKey')}
                </label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t('onboarding.apiKeyPlaceholder')}
                  className={inputClass}
                />
              </div>

              <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                <p className="text-[11px] text-white/35 leading-relaxed">
                  {t('onboarding.apiKeyHint')}
                </p>
              </div>

              {jellyfinError && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3">
                  <p className="text-red-400 text-xs text-center">{jellyfinError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={jellyfinLoading}
                className={`w-full flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 mt-2 ${TRANSITION}`}
              >
                {jellyfinLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    {t('onboarding.connectBtn')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── Step Indicators ─── */}
        <div className="flex items-center justify-center gap-2 mt-8">
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
    </div>
  )
}
