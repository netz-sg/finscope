import { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  Settings, Server, Info, Github, Coffee, Trash2, Globe,
  User, Camera, Check, Loader2, Eye, EyeOff, KeyRound, Pencil, RotateCcw,
  Bell, Plus, X, Send, Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useUIStore } from '../../store/useUIStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { NotificationsAPI } from '../../api/notifications'
import { toast } from '../../store/useToastStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'
import type { WebhookConfig } from '../../types/app'
import i18n from '../../i18n'

type Tab = 'profile' | 'server' | 'notifications' | 'about'

export default function SettingsView() {
  const { t } = useTranslation()
  const {
    config, isDemoMode, logout,
    user, jellyfinConfig,
    updateProfile, changePassword, uploadAvatar, removeAvatar,
  } = useAppStore()
  const setShowOnboardingTour = useUIStore((s) => s.setShowOnboardingTour)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

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

  const { settings: notifSettings, setSettings: setNotifSettings, webhooks, setWebhooks } = useNotificationStore()
  const [webhookForm, setWebhookForm] = useState({ name: '', platform: 'discord' as string, webhookUrl: '' })
  const [showWebhookForm, setShowWebhookForm] = useState(false)
  const [webhookLoading, setWebhookLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'notifications') {
      NotificationsAPI.getSettings().then(setNotifSettings)
      NotificationsAPI.getWebhooks().then(setWebhooks)
    }
  }, [activeTab, setNotifSettings, setWebhooks])

  const handleNotifToggle = async (key: keyof typeof notifSettings, value: boolean | number) => {
    const updated = { ...notifSettings, [key]: value }
    setNotifSettings(updated)
    await NotificationsAPI.saveSettings(updated)
  }

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.webhookUrl) return
    setWebhookLoading(true)
    const created = await NotificationsAPI.createWebhook(webhookForm)
    if (created) {
      setWebhooks([created, ...webhooks])
      setWebhookForm({ name: '', platform: 'discord', webhookUrl: '' })
      setShowWebhookForm(false)
      toast.success(t('notifications.webhookCreated'))
    }
    setWebhookLoading(false)
  }

  const handleDeleteWebhook = async (id: number) => {
    await NotificationsAPI.deleteWebhook(id)
    setWebhooks(webhooks.filter((w) => w.id !== id))
  }

  const handleTestWebhook = async (id: number) => {
    const success = await NotificationsAPI.testWebhook(id)
    if (success) toast.success(t('notifications.testSent'))
    else toast.error(t('notifications.testFailed'))
  }

  const handleToggleWebhook = async (wh: WebhookConfig) => {
    await NotificationsAPI.updateWebhook(wh.id, { isActive: !wh.isActive })
    setWebhooks(webhooks.map((w) => w.id === wh.id ? { ...w, isActive: !w.isActive } : w))
  }

  const tabs: { id: Tab; icon: typeof User; label: string }[] = [
    { id: 'profile', icon: User, label: t('profile.title') },
    { id: 'server', icon: Server, label: t('settings.localServer') },
    { id: 'notifications', icon: Bell, label: t('notifications.title') },
    { id: 'about', icon: Info, label: t('settings.about') },
  ]

  return (
    <section className="space-y-6">
      {/* ---------- Title ---------- */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <Settings size={20} className="text-white/70" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">{t('settings.title')}</h2>
      </div>

      {/* ---------- Tab Bar ---------- */}
      <div className={`rounded-2xl p-1.5 inline-flex gap-1 ${GLASS_INNER}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white/12 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ---------- Tab Content ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ════════ Profile Tab ════════ */}
        {activeTab === 'profile' && (
          <>
            {/* Avatar & Info */}
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
            </div>

            {/* Security */}
            <div className={`rounded-[2.5rem] p-8 h-fit ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3 mb-8">
                <KeyRound size={18} className="text-amber-400" />
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  {t('profile.changePassword')}
                </p>
              </div>

              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-3">
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
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white/60 hover:text-white ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                >
                  <KeyRound size={14} />
                  {t('profile.changePassword')}
                </button>
              )}
            </div>
          </>
        )}

        {/* ════════ Server Tab ════════ */}
        {activeTab === 'server' && (
          <>
            {/* Connection */}
            <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3 mb-8">
                <Server size={18} className="text-green-400" />
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  {t('settings.connectedInstance')}
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

              <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                  {t('settings.apiTokenLabel')}
                </p>
                <p className="text-sm font-mono font-semibold text-white/60 break-all">
                  {maskedToken}
                </p>
              </div>
            </div>

            {/* Language & Actions */}
            <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3 mb-8">
                <Globe size={18} className="text-cyan-400" />
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  Language / Sprache
                </p>
              </div>

              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => switchLanguage('de')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    currentLang === 'de'
                      ? 'bg-white/15 text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.05] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  Deutsch
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    currentLang === 'en'
                      ? 'bg-white/15 text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.05] hover:bg-white/[0.08] hover:text-white/70'
                  }`}
                >
                  English
                </button>
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
          </>
        )}

        {/* ════════ Notifications Tab ════════ */}
        {activeTab === 'notifications' && (
          <>
            <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3 mb-8">
                <Bell size={18} className="text-blue-400" />
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  {t('notifications.alerts')}
                </p>
              </div>

              <div className="space-y-4">
                {([
                  { key: 'streamStart' as const, label: t('notifications.streamStart'), desc: t('notifications.streamStartDesc') },
                  { key: 'streamEnd' as const, label: t('notifications.streamEnd'), desc: t('notifications.streamEndDesc') },
                  { key: 'transcodeLoad' as const, label: t('notifications.transcodeLoad'), desc: t('notifications.transcodeLoadDesc') },
                  { key: 'serverError' as const, label: t('notifications.serverError'), desc: t('notifications.serverErrorDesc') },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className={`rounded-2xl p-5 flex items-center justify-between ${GLASS_INNER}`}>
                    <div>
                      <p className="text-sm font-semibold text-white/80">{label}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotifToggle(key, !notifSettings[key])}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        notifSettings[key] ? 'bg-blue-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                        notifSettings[key] ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="pt-2 space-y-3">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('notifications.thresholds')}</p>
                  <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/70">{t('notifications.concurrentStreams')}</p>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={notifSettings.thresholdConcurrent}
                        onChange={(e) => handleNotifToggle('thresholdConcurrent', parseInt(e.target.value) || 5)}
                        className={`w-16 rounded-lg p-2 text-center text-sm font-mono text-white ${GLASS_INNER} focus:outline-none focus:ring-1 focus:ring-white/20`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/70">{t('notifications.transcodeSessions')}</p>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={notifSettings.thresholdTranscode}
                        onChange={(e) => handleNotifToggle('thresholdTranscode', parseInt(e.target.value) || 3)}
                        className={`w-16 rounded-lg p-2 text-center text-sm font-mono text-white ${GLASS_INNER} focus:outline-none focus:ring-1 focus:ring-white/20`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-amber-400" />
                  <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                    Webhooks
                  </p>
                </div>
                <button
                  onClick={() => setShowWebhookForm(!showWebhookForm)}
                  className={`p-2 rounded-xl ${GLASS_INNER} hover:bg-white/[0.06] ${TRANSITION}`}
                >
                  {showWebhookForm ? <X size={16} className="text-white/50" /> : <Plus size={16} className="text-white/50" />}
                </button>
              </div>

              {showWebhookForm && (
                <div className={`rounded-2xl p-5 mb-4 space-y-3 ${GLASS_INNER}`}>
                  <input
                    type="text"
                    placeholder={t('notifications.webhookName')}
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    {(['discord', 'telegram', 'slack'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setWebhookForm({ ...webhookForm, platform: p })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize ${TRANSITION} ${
                          webhookForm.platform === p
                            ? 'bg-white/12 text-white border border-white/20'
                            : `text-white/40 ${GLASS_INNER} hover:text-white/70`
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder={t('notifications.webhookUrl')}
                    value={webhookForm.webhookUrl}
                    onChange={(e) => setWebhookForm({ ...webhookForm, webhookUrl: e.target.value })}
                    className={inputClass}
                  />
                  <button
                    onClick={handleCreateWebhook}
                    disabled={webhookLoading || !webhookForm.name || !webhookForm.webhookUrl}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 ${TRANSITION}`}
                  >
                    {webhookLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {t('notifications.addWebhook')}
                  </button>
                </div>
              )}

              {webhooks.length === 0 && !showWebhookForm ? (
                <div className={`rounded-2xl p-8 flex flex-col items-center gap-3 ${GLASS_INNER}`}>
                  <Zap size={28} className="text-white/15" />
                  <p className="text-xs text-white/25 text-center">{t('notifications.noWebhooks')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className={`rounded-2xl p-4 ${GLASS_INNER}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            wh.platform === 'discord' ? 'bg-indigo-500/20 text-indigo-400' :
                            wh.platform === 'telegram' ? 'bg-sky-500/20 text-sky-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>{wh.platform}</span>
                          <p className="text-sm font-semibold text-white/80">{wh.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTestWebhook(wh.id)}
                            className={`p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-white/[0.06] ${TRANSITION}`}
                          >
                            <Send size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleWebhook(wh)}
                            className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
                              wh.isActive ? 'bg-green-500' : 'bg-white/10'
                            }`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                              wh.isActive ? 'left-[18px]' : 'left-0.5'
                            }`} />
                          </button>
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className={`p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.06] ${TRANSITION}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/25 font-mono truncate">{wh.webhookUrl}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════ About Tab ════════ */}
        {activeTab === 'about' && (
          <>
            {/* App Info */}
            <div className={`rounded-[2.5rem] p-8 ${GLASS_PANEL}`}>
              <div className="flex flex-col items-center text-center mb-8">
                <img src="/icon_finscope.png" alt="FinScope" className="w-20 h-20 rounded-2xl mb-5 shadow-[0_0_40px_rgba(99,102,241,0.2)]" />
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

              <div className={`rounded-2xl p-5 ${GLASS_INNER}`}>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('settings.description')}
                </p>
              </div>
            </div>

            {/* Links & Tour */}
            <div className={`rounded-[2.5rem] p-8 h-fit ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3 mb-8">
                <Info size={18} className="text-white/50" />
                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                  Links
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all duration-300 ${GLASS_INNER} hover:bg-white/[0.06]`}
                >
                  <Github size={18} />
                  GitHub
                </a>
                <a
                  href="https://buymeacoffee.com/sgnetz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all duration-300 ${GLASS_INNER} hover:bg-white/[0.06]`}
                >
                  <Coffee size={18} />
                  Buy Me a Coffee
                </a>

                <div className="pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => setShowOnboardingTour(true)}
                    className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition-all duration-300 ${GLASS_INNER} hover:bg-white/[0.06]`}
                  >
                    <RotateCcw size={16} />
                    {t('settings.restartTour')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </section>
  )
}
