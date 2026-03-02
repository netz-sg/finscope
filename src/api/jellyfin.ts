import type { Session, JellyfinUser, ItemCounts, ServerInfo, ItemDetail, NowPlayingItem, LibraryFolder, AlbumTrack } from '../types/jellyfin'

const getToken = () => localStorage.getItem('finscope_session_token')

const getAuthHeaders = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const authFetch = async <T>(url: string, fallback: T): Promise<T> => {
  try {
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

export const JellyfinAPI = {
  connect: (_url: string, _apiKey: string): Promise<ServerInfo> =>
    authFetch<ServerInfo | null>('/api/jellyfin/system-info', null).then((data) => {
      if (!data) throw new Error('Connection failed')
      return data
    }),

  getSessions: (_url: string, _apiKey: string): Promise<Session[]> =>
    authFetch<Session[]>('/api/jellyfin/sessions', []).then((sessions) => {
      const withItem = sessions.filter((s) => s.NowPlayingItem != null)
      const deviceMap = new Map<string, Session>()
      for (const s of withItem) {
        const key = `${s.UserId}:${s.DeviceName}`
        const existing = deviceMap.get(key)
        if (!existing) {
          deviceMap.set(key, s)
          continue
        }
        const existingPaused = existing.PlayState.IsPaused
        const currentPaused = s.PlayState.IsPaused
        if (existingPaused && !currentPaused) {
          deviceMap.set(key, s)
          continue
        }
        if (!existingPaused && currentPaused) continue
        const existingTime = existing.LastActivityDate ? new Date(existing.LastActivityDate).getTime() : 0
        const currentTime = s.LastActivityDate ? new Date(s.LastActivityDate).getTime() : 0
        if (currentTime > existingTime) deviceMap.set(key, s)
      }
      return [...deviceMap.values()]
    }),

  getUsers: (_url: string, _apiKey: string): Promise<JellyfinUser[]> =>
    authFetch<JellyfinUser[]>('/api/jellyfin/users', []),

  getUserHistory: (_url: string, _apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    authFetch<NowPlayingItem[]>(`/api/jellyfin/users/${userId}/history?limit=3`, []),

  getUserStats: (_url: string, _apiKey: string, userId: string): Promise<{ playCount: number }> =>
    authFetch<{ TotalRecordCount?: number }>(
      `/api/jellyfin/users/${userId}/play-count`,
      { TotalRecordCount: 0 },
    ).then((data) => ({ playCount: data.TotalRecordCount || 0 })),

  syncHistory: async (force = false): Promise<{ newEntries: number; totalEntries: number }> => {
    try {
      const url = force ? '/api/history/sync?force=true' : '/api/history/sync'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      })
      if (!response.ok) {
        console.warn(`[syncHistory] HTTP ${response.status}: ${await response.text().catch(() => 'no body')}`)
        return { newEntries: 0, totalEntries: 0 }
      }
      return await response.json()
    } catch (err) {
      console.warn('[syncHistory] Fetch failed:', err)
      return { newEntries: 0, totalEntries: 0 }
    }
  },

  getStoredAnalytics: async (): Promise<{
    historyMap: Record<string, number>
    peakHours: number[]
    totalPlays: number
  }> => {
    try {
      const response = await fetch('/api/history/analytics', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        console.warn(`[getStoredAnalytics] HTTP ${response.status}`)
        return { historyMap: {}, peakHours: Array(24).fill(0), totalPlays: 0 }
      }
      return await response.json()
    } catch (err) {
      console.warn('[getStoredAnalytics] Fetch failed:', err)
      return { historyMap: {}, peakHours: Array(24).fill(0), totalPlays: 0 }
    }
  },

  trackSessions: async (sessions: { userId: string; userName: string; itemId: string; itemName: string; itemType: string; client: string; positionTicks?: number; runtimeTicks?: number; isTranscoding?: boolean }[]): Promise<void> => {
    if (sessions.length === 0) return
    try {
      await fetch('/api/history/track-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ sessions }),
      })
    } catch {
      // noop
    }
  },

  getCounts: (_url: string, _apiKey: string): Promise<ItemCounts | null> =>
    authFetch<ItemCounts | null>('/api/jellyfin/item-counts', null),

  getMostPlayed: (_url: string, _apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    authFetch<NowPlayingItem[]>(`/api/jellyfin/users/${userId}/most-played?limit=5`, []),

  getLatestItems: (_url: string, _apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    authFetch<NowPlayingItem[]>(`/api/jellyfin/users/${userId}/latest?limit=10`, []),

  getLibraries: (_url: string, _apiKey: string, userId: string): Promise<LibraryFolder[]> =>
    authFetch<LibraryFolder[]>(`/api/jellyfin/users/${userId}/libraries`, []),

  getItemDetail: (
    _url: string,
    _apiKey: string,
    userId: string,
    itemId: string,
  ): Promise<ItemDetail | null> =>
    authFetch<ItemDetail | null>(`/api/jellyfin/users/${userId}/items/${itemId}`, null),

  getItemImageUrl: (_serverUrl: string, itemId: string, type = 'Primary'): string => {
    const token = getToken()
    return `/api/jellyfin/image?itemId=${encodeURIComponent(itemId)}&type=${type}${token ? `&token=${token}` : ''}`
  },

  getLogoUrl: (_serverUrl: string, itemId: string): string => {
    const token = getToken()
    return `/api/jellyfin/image?itemId=${encodeURIComponent(itemId)}&type=Logo${token ? `&token=${token}` : ''}`
  },

  getUserImageUrl: (_serverUrl: string, userId: string): string => {
    const token = getToken()
    return `/api/jellyfin/user-image?userId=${encodeURIComponent(userId)}${token ? `&token=${token}` : ''}`
  },

  getRandomHeroItems: (_url: string, _apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    authFetch<NowPlayingItem[]>(`/api/jellyfin/users/${userId}/hero-items`, []),

  getPulseStats: async (): Promise<{
    dbSizeBytes: number
    totalHistoryEntries: number
    lastSyncTime: string | null
  }> => {
    try {
      const response = await fetch('/api/pulse-stats', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) return { dbSizeBytes: 0, totalHistoryEntries: 0, lastSyncTime: null }
      return await response.json()
    } catch {
      return { dbSizeBytes: 0, totalHistoryEntries: 0, lastSyncTime: null }
    }
  },

  getGenreDistribution: async (): Promise<{ name: string; count: number; pct: number }[]> => {
    try {
      const response = await fetch('/api/genres', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.genres ?? []
    } catch {
      return []
    }
  },

  getArtistAlbums: (
    _url: string,
    _apiKey: string,
    userId: string,
    artistId: string,
  ): Promise<NowPlayingItem[]> =>
    authFetch<NowPlayingItem[]>(
      `/api/jellyfin/users/${userId}/artist-albums?artistId=${encodeURIComponent(artistId)}`,
      [],
    ),

  getAlbumTracks: (
    _url: string,
    _apiKey: string,
    userId: string,
    albumId: string,
  ): Promise<AlbumTrack[]> =>
    authFetch<AlbumTrack[]>(
      `/api/jellyfin/users/${userId}/album-tracks?albumId=${encodeURIComponent(albumId)}`,
      [],
    ),

  getTrends: async (period: 'weekly' | 'monthly' = 'weekly') => {
    try {
      const res = await fetch(`/api/history/analytics/trends?period=${period}`, { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },

  getPopularThisWeek: async () => {
    try {
      const res = await fetch('/api/history/analytics/popular', { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },

  getUserComparison: async () => {
    try {
      const res = await fetch('/api/history/analytics/user-comparison', { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },

  getCompletionRates: async () => {
    try {
      const res = await fetch('/api/history/analytics/completion-rates', { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },

  sendPlaystateCommand: async (sessionId: string, command: 'Pause' | 'Unpause' | 'Stop' | 'NextTrack' | 'PreviousTrack'): Promise<boolean> => {
    try {
      const response = await fetch(`/api/jellyfin/sessions/${encodeURIComponent(sessionId)}/playstate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ command }),
      })
      return response.ok
    } catch {
      return false
    }
  },

  getActivityLog: async (limit = 50, startIndex = 0) => {
    try {
      const res = await fetch(`/api/jellyfin/activity?limit=${limit}&startIndex=${startIndex}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },

  getBandwidthHistory: async (range: '24h' | '7d' | '30d' = '24h') => {
    try {
      const res = await fetch(`/api/history/analytics/bandwidth?range=${range}`, { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch { return [] }
  },
}
