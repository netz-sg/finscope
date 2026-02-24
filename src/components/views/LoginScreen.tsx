import { useState, type FormEvent } from 'react'
import { Radio, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'

export default function LoginScreen() {
  const { t } = useTranslation()
  const { login } = useAppStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `w-full rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 font-mono text-sm ${GLASS_INNER}`

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none" />

      <div className={`w-full max-w-md z-10 rounded-4xl sm:rounded-[3rem] p-6 sm:p-10 ${GLASS_PANEL}`}>
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <Radio size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">FINSCOPE</h1>
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase mt-2">
            {t('app.subtitle')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              {t('auth.username')}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
              className={inputClass}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoComplete="current-password"
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

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3">
              <p className="text-red-400 text-xs text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white text-black rounded-2xl py-4 font-bold text-sm hover:bg-neutral-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] disabled:opacity-50 mt-6 ${TRANSITION}`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              t('auth.login')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
