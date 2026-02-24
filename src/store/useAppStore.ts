import { create } from 'zustand'
import { AuthAPI } from '../api/auth'
import type { AppStatus, AppPhase, AppConfig, FinScopeUser, JellyfinConfigData } from '../types/app'
import type { ServerInfo } from '../types/jellyfin'

interface AppState {
  // Phase-based routing
  phase: AppPhase

  // User account
  user: FinScopeUser | null
  sessionToken: string | null

  // Jellyfin connection (from server)
  jellyfinConfig: JellyfinConfigData | null

  // Backward-compatible fields (used by existing Dashboard components)
  config: AppConfig
  status: AppStatus
  errorMsg: string
  isDemoMode: boolean
  serverInfo: ServerInfo | null

  // Actions
  initialize: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  saveJellyfinConfig: (serverUrl: string, apiKey: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: { username?: string; displayName?: string }) => Promise<void>
  changePassword: (currentPw: string, newPw: string) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<void>
  removeAvatar: () => Promise<void>
  refreshProfile: () => Promise<void>

  // Legacy setters (for existing components)
  setConfig: (config: Partial<AppConfig>) => void
  setStatus: (status: AppStatus) => void
  setErrorMsg: (msg: string) => void
  setDemoMode: (demo: boolean) => void
  setServerInfo: (info: ServerInfo | null) => void
  setRememberMe: (remember: boolean) => void
  rememberMe: boolean
  loadSavedConfig: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'loading',
  user: null,
  sessionToken: null,
  jellyfinConfig: null,

  config: { url: '', apiKey: '', userId: '' },
  status: 'idle',
  errorMsg: '',
  isDemoMode: false,
  rememberMe: false,
  serverInfo: null,

  initialize: async () => {
    const token = localStorage.getItem('finscope_session_token')

    if (token) {
      try {
        const data = await AuthAPI.getMe()
        const jf = data.jellyfinConfig
        set({
          phase: 'authenticated',
          user: data.user as FinScopeUser,
          sessionToken: token,
          jellyfinConfig: jf,
          config: jf
            ? { url: jf.serverUrl, apiKey: '', userId: jf.jellyfinUserId }
            : { url: '', apiKey: '', userId: '' },
          status: jf ? 'success' : 'idle',
        })
        return
      } catch {
        localStorage.removeItem('finscope_session_token')
      }
    }

    // No valid token — check if setup is complete
    try {
      const setup = await AuthAPI.getSetupStatus()
      set({ phase: setup.hasUsers ? 'login' : 'onboarding' })
    } catch {
      set({ phase: 'onboarding' })
    }
  },

  register: async (username, password) => {
    const data = await AuthAPI.register(username, password)
    if (data.error) throw new Error(data.error)
    localStorage.setItem('finscope_session_token', data.token)
    set({
      user: data.user as FinScopeUser,
      sessionToken: data.token,
      // Stay in onboarding phase — user still needs to connect Jellyfin
    })
  },

  login: async (username, password) => {
    const data = await AuthAPI.login(username, password)
    if (data.error || !data.token || !data.user) throw new Error(data.error || 'Login failed')
    localStorage.setItem('finscope_session_token', data.token)

    // Fetch full profile to get Jellyfin config
    const me = await AuthAPI.getMe()
    const jf = me.jellyfinConfig

    set({
      phase: 'authenticated',
      user: me.user as FinScopeUser,
      sessionToken: data.token,
      jellyfinConfig: jf,
      config: jf
        ? { url: jf.serverUrl, apiKey: '', userId: jf.jellyfinUserId }
        : { url: '', apiKey: '', userId: '' },
      status: jf ? 'success' : 'idle',
    })
  },

  logout: async () => {
    try {
      await AuthAPI.logout()
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('finscope_session_token')
    set({
      phase: 'login',
      user: null,
      sessionToken: null,
      jellyfinConfig: null,
      config: { url: '', apiKey: '', userId: '' },
      status: 'idle',
      errorMsg: '',
      isDemoMode: false,
      serverInfo: null,
    })
  },

  saveJellyfinConfig: async (serverUrl, apiKey) => {
    const result = await AuthAPI.saveJellyfinConfig(serverUrl, apiKey)
    if (result.error) return { success: false, error: result.error }

    // Refresh profile to get updated Jellyfin config
    const me = await AuthAPI.getMe()
    const jf = me.jellyfinConfig

    set({
      phase: 'authenticated',
      jellyfinConfig: jf,
      config: jf
        ? { url: jf.serverUrl, apiKey: '', userId: jf.jellyfinUserId }
        : { url: '', apiKey: '', userId: '' },
      status: jf ? 'success' : 'idle',
      serverInfo: jf ? { ServerName: jf.serverName, Version: '', OperatingSystem: '' } : null,
    })

    return { success: true }
  },

  updateProfile: async (data) => {
    const result = await AuthAPI.updateProfile(data)
    if (result.user) {
      set({ user: result.user as FinScopeUser })
    }
  },

  changePassword: async (currentPw, newPw) => {
    const result = await AuthAPI.changePassword(currentPw, newPw)
    if (result.error) return { success: false, error: result.error }
    return { success: true }
  },

  uploadAvatar: async (file) => {
    const result = await AuthAPI.uploadAvatar(file)
    const user = get().user
    if (user && result.avatarUrl) {
      set({ user: { ...user, avatarUrl: result.avatarUrl } })
    }
  },

  removeAvatar: async () => {
    await AuthAPI.removeAvatar()
    const user = get().user
    if (user) {
      set({ user: { ...user, avatarUrl: null } })
    }
  },

  refreshProfile: async () => {
    try {
      const me = await AuthAPI.getMe()
      const jf = me.jellyfinConfig
      set({
        user: me.user as FinScopeUser,
        jellyfinConfig: jf,
        config: jf
          ? { url: jf.serverUrl, apiKey: '', userId: jf.jellyfinUserId }
          : { url: '', apiKey: '', userId: '' },
      })
    } catch {
      // Ignore refresh errors
    }
  },

  // Legacy setters for backward compat
  setConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
  setStatus: (status) => set({ status }),
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),
  setRememberMe: () => {},
  setServerInfo: (serverInfo) => set({ serverInfo }),
  loadSavedConfig: () => {
    // Replaced by initialize() — kept for compat
    get().initialize()
  },
}))
