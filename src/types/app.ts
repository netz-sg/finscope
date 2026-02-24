export type AppStatus = 'idle' | 'connecting' | 'success' | 'error'

export type AppPhase = 'loading' | 'onboarding' | 'login' | 'authenticated'

export interface AppConfig {
  url: string
  apiKey: string
  userId: string
}

export interface FinScopeUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string | null
  role: 'admin' | 'viewer'
}

export interface JellyfinConfigData {
  serverUrl: string
  apiKeyMasked: string
  jellyfinUserId: string
  serverName: string
}

export interface AnalyticsData {
  historyMap: Record<string, number>
  peakHours: number[]
  clients: Record<string, number>
}

export interface LibraryData {
  mostPlayed: import('./jellyfin').NowPlayingItem[]
  latest: import('./jellyfin').NowPlayingItem[]
  libraries: import('./jellyfin').LibraryFolder[]
}

export interface MediaTypeConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
  bg: string
  border: string
}
