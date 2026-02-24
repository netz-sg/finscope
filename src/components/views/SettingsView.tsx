import { useState, useRef, type FormEvent } from 'react'
import {
  Settings, Server, Info, Radio, Github, Coffee, Heart, Trash2, Globe,
  User, Camera, Check, Loader2, Eye, EyeOff, KeyRound, Pencil,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { toast } from '../../store/useToastStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'
import i18n from '../../i18n'

export default function SettingsView() {
  const { t } = useTranslation()
  const {
    config, isDemoMode, logout,
    user, jellyfinConfig,
    updateProfile, changePassword, uploadAvatar, removeAvatar,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [editUsername, setEditUsername] = useState(user?.username || '')
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false)

  const currentLang = i18n.language

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('finscope_lang', lang)
  }

  const handleLogout = () => {
    localStorage.removeItem('finscope_lang')
    toast.info(t('toast.loggedOut'))
    logout()
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile({
        username: editUsername.trim() || undefined,
        displayName: editDisplayName.trim() || undefined,
      })
      toast.success(t('toast.profileSaved'))
      setEditingProfile(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('toast.error'))
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwError('')

    if (newPw.length < 6) {
      setPwError(t('profile.passwordMin'))
      return
    }
    if (newPw !== confirmPw) {
      setPwError(t('profile.passwordMismatch'))
      return
    }

    setPwLoading(true)
    try {
      const result = await changePassword(currentPw, newPw)
      if (!result.success) {
        setPwError(result.error || t('profile.passwordError'))
      } else {
        toast.success(t('toast.passwordChanged'))
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
        setShowPasswordForm(false)
      }
    } catch {
      setPwError(t('profile.passwordError'))
    } finally {
      setPwLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      await uploadAvatar(file)
      toast.success(t('toast.avatarUploaded'))
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true)
    try {
      await removeAvatar()
      toast.success(t('toast.avatarRemoved'))
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setAvatarLoading(false)
    }
  }

  const inputClass = `w-full rounded-xl p-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 text-sm ${GLASS_INNER}`

  const serverDisplay = jellyfinConfig?.serverUrl || config.url || '--'
  const maskedToken = jellyfinConfig?.apiKeyMasked || '****'

  return (
    <section className="space-y-6">
      {/* ---------- Title ---------- */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <Settings size={20} className="text-white/70" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">{t('settings.title')}</h2>
      </div>

      {/* ---------- Grid ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ====== Left Column ====== */}
        <div className="space-y-6">

          {/* ── User Profile ── */}
          <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
            <div className="flex items-center gap-3 mb-8">
              <User size={18} className="text-indigo-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                {t('profile.title')}
              </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={handleAvatarClick}
                disabled={avatarLoading}
                className={`relative w-24 h-24 rounded-full overflow-hidden group ${GLASS_INNER} ${TRANSITION}`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={36} className="text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarLoading ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>
              </button>
              {user?.avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-[10px] text-white/30 hover:text-red-400 mt-2 transition-colors"
                >
                  {t('profile.removeAvatar')}
                </button>
              )}
            </div>

            {/* Profile info / edit form */}
            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">
                    {t('profile.username')}
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">
                    {t('profile.displayName')}
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder={t('profile.displayNamePlaceholder')}
                    className={inputClass}
                  />
                </div>

                
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white/50 ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                  >
                    {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 ${TRANSITION}`}
                  >
                    {profileLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {t('profile.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    {t('profile.username')}
                  </p>
                  <p className="text-sm font-semibold text-white/90">{user?.username || '--'}</p>
                </div>
                {user?.displayName && (
                  <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                      {t('profile.displayName')}
                    </p>
                    <p className="text-sm font-semibold text-white/90">{user.displayName}</p>
                  </div>
                )}

                
                <button
                  onClick={() => {
                    setEditUsername(user?.username || '')
                    setEditDisplayName(user?.displayName || '')
                    setEditingProfile(true)
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                >
                  <Pencil size={14} />
                  {t('profile.edit')}
                </button>
              </div>
            )}

            {/* Password change */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound size={14} className="text-white/40" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {t('profile.changePassword')}
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder={t('profile.currentPassword')}
                      className={inputClass}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder={t('profile.newPassword')}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder={t('profile.confirmPassword')}
                    className={inputClass}
                    autoComplete="new-password"
                  />

                  {pwError && (
                    <p className="text-xs text-center text-red-400">{pwError}</p>
                  )}
                  
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPwError('')
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white/50 ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                    >
                      {t('profile.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 ${TRANSITION}`}
                    >
                      {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {t('profile.save')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                                    <button
                    onClick={() => setShowPasswordForm(true)}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                  >
                    <KeyRound size={14} />
                    {t('profile.changePassword')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Server Info ── */}
          <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
            <div className="flex items-center gap-3 mb-8">
              <Server size={18} className="text-green-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                {t('settings.localServer')}
              </p>
            </div>

            <div className={`rounded-2xl p-5 mb-4 ${GLASS_INNER}`}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                {t('settings.connectedInstance')}
              </p>
              <p className="text-sm font-mono font-semibold text-white/90 break-all">
                {isDemoMode ? t('settings.demoMode') : serverDisplay}
              </p>
            </div>

            <div className={`rounded-2xl p-5 mb-6 ${GLASS_INNER}`}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                {t('settings.apiTokenLabel')}
              </p>
              <p className="text-sm font-mono font-semibold text-white/60 break-all">
                {maskedToken}
              </p>
            </div>

            {/* Language switcher */}
            <div className={`rounded-2xl p-5 mb-6 ${GLASS_INNER}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-white/40" />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Language / Sprache
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchLanguage('de')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    currentLang === 'de'
                      ? 'bg-white/15 text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.05] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  DE
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    currentLang === 'en'
                      ? 'bg-white/15 text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.05] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            >
              <Trash2 size={16} />
              {t('settings.logout')}
            </button>
          </div>
        </div>

        {/* ====== Right: About ====== */}
        <div className={`rounded-[2.5rem] p-8 h-fit ${GLASS_PANEL}`}>
          <div className="flex items-center gap-3 mb-8">
            <Info size={18} className="text-white/50" />
            <p className="text-sm font-bold uppercase tracking-wider text-white/60">
              {t('settings.about')}
            </p>
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              <Radio size={32} />
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase">
              {t('app.name')}
            </h3>
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase mt-1">
              {t('app.subtitle')}
            </p>
            <p className="text-[10px] font-mono text-white/30 mt-2">
              {t('app.version')}
            </p>
          </div>

          <div className={`rounded-2xl p-5 mb-6 ${GLASS_INNER}`}>
            <p className="text-sm text-white/50 leading-relaxed">
              {t('settings.description')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all duration-300 ${GLASS_INNER} hover:bg-white/[0.06]`}
            >
              <Github size={18} />
              GitHub
            </a>
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all duration-300 ${GLASS_INNER} hover:bg-white/[0.06]`}
            >
              <Coffee size={18} />
              Coffee
            </a>
          </div>

          <p className="text-center text-xs text-white/25 font-mono tracking-wider">
            {t('settings.madeWith')} <Heart size={12} className="inline text-red-400 mx-0.5 align-[-2px]" /> in Germany
          </p>
        </div>
      </div>
    </section>
  )
}
