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

export interface NotificationSettings {
  streamStart: boolean
  streamEnd: boolean
  transcodeLoad: boolean
  serverError: boolean
  thresholdConcurrent: number
  thresholdTranscode: number
}

export interface StreamMeta {
  itemId?: string
  itemType?: string
  userName?: string
  seriesName?: string
  artists?: string[]
  album?: string
  indexNumber?: number
  parentIndexNumber?: number
}

export interface NotificationItem {
  id: number
  eventType: string
  title: string
  message: string
  isRead: boolean
  meta?: StreamMeta
  createdAt: string
}

export interface WebhookConfig {
  id: number
  name: string
  platform: 'discord' | 'telegram' | 'slack'
  webhookUrl: string
  isActive: boolean
}

export interface TrendDataPoint {
  date: string
  current: number
  previous: number
}

export interface PopularItem {
  itemId: string
  itemName: string
  itemType: string
  playCount: number
}

export interface UserComparisonEntry {
  userId: string
  userName: string
  hasImage: boolean
  playCount: number
}

export interface CompletionRateEntry {
  itemId: string
  itemName: string
  itemType: string
  completionRate: number
}

export interface ExtendedAnalytics {
  trends: TrendDataPoint[]
  popular: PopularItem[]
  userComparison: UserComparisonEntry[]
  completionRates: CompletionRateEntry[]
}
