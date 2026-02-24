import type { Session, JellyfinUser, ItemCounts, ServerInfo, ItemDetail, NowPlayingItem, LibraryFolder, AlbumTrack } from '../types/jellyfin'

const getToken = () => localStorage.getItem('finscope_session_token')

const getAuthHeaders = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// _url and _apiKey kept for compat but proxy reads creds from DB now
const proxyFetch = async <T>(
  endpoint: string,
  _url: string,
  _apiKey: string,
  fallback: T,
): Promise<T> => {
  try {
    const params = new URLSearchParams({ endpoint })
    const response = await fetch(`/api/jellyfin?${params}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

export const JellyfinAPI = {
  connect: (url: string, apiKey: string): Promise<ServerInfo> =>
    proxyFetch<ServerInfo>('/System/Info', url, apiKey, null as unknown as ServerInfo).then(
      (data) => {
        if (!data) throw new Error('Connection failed')
        return data
      },
    ),

  getSessions: (url: string, apiKey: string): Promise<Session[]> =>
    proxyFetch<Session[]>('/Sessions', url, apiKey, []).then((sessions) =>
      sessions.filter((s) => s.NowPlayingItem != null),
    ),

  getUsers: (url: string, apiKey: string): Promise<JellyfinUser[]> =>
    proxyFetch<JellyfinUser[]>('/Users', url, apiKey, []),

  getUserHistory: (url: string, apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    proxyFetch<{ Items?: NowPlayingItem[] }>(
      `/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&Filters=IsPlayed&Limit=3`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),

  getUserStats: (url: string, apiKey: string, userId: string): Promise<{ playCount: number }> =>
    proxyFetch<{ TotalRecordCount?: number }>(
      `/Users/${userId}/Items?Filters=IsPlayed&Recursive=true&Limit=1`,
      url,
      apiKey,
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

  trackSessions: async (sessions: { userId: string; userName: string; itemId: string; itemName: string; itemType: string; client: string }[]): Promise<void> => {
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

  getCounts: (url: string, apiKey: string): Promise<ItemCounts | null> =>
    proxyFetch<ItemCounts | null>('/Items/Counts', url, apiKey, null),

  getMostPlayed: (url: string, apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    proxyFetch<{ Items?: NowPlayingItem[] }>(
      `/Users/${userId}/Items?SortBy=PlayCount&SortOrder=Descending&Filters=IsPlayed&Limit=5&Recursive=true&IncludeItemTypes=Movie,Series,Audio&Fields=PlayCount`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),

  getLatestItems: (url: string, apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    proxyFetch<NowPlayingItem[]>(
      `/Users/${userId}/Items/Latest?Limit=10&Fields=PrimaryImageAspectRatio,Overview`,
      url,
      apiKey,
      [],
    ),

  getLibraries: (url: string, apiKey: string, userId: string): Promise<LibraryFolder[]> =>
    proxyFetch<{ Items?: LibraryFolder[] }>(
      `/Users/${userId}/Views`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),

  getItemDetail: (
    url: string,
    apiKey: string,
    userId: string,
    itemId: string,
  ): Promise<ItemDetail | null> =>
    proxyFetch<ItemDetail | null>(
      `/Users/${userId}/Items/${itemId}?Fields=Overview,Genres,People,Studios,OfficialRating,CommunityRating,RunTimeTicks,Artists,ArtistItems,Album,AlbumId,IndexNumber,ParentIndexNumber,ChildCount`,
      url,
      apiKey,
      null,
    ),

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

  getRandomHeroItems: (url: string, apiKey: string, userId: string): Promise<NowPlayingItem[]> =>
    proxyFetch<{ Items?: NowPlayingItem[] }>(
      `/Users/${userId}/Items?SortBy=Random&Limit=10&Recursive=true&IncludeItemTypes=Movie,Series&Fields=Overview,ParentBackdropItemId,ParentLogoItemId`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),

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
    url: string,
    apiKey: string,
    userId: string,
    artistId: string,
  ): Promise<NowPlayingItem[]> =>
    proxyFetch<{ Items?: NowPlayingItem[] }>(
      `/Users/${userId}/Items?ArtistIds=${artistId}&IncludeItemTypes=MusicAlbum&Recursive=true&SortBy=ProductionYear,SortName&SortOrder=Descending&Fields=Overview,Genres,ProductionYear`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),

  getAlbumTracks: (
    url: string,
    apiKey: string,
    userId: string,
    albumId: string,
  ): Promise<AlbumTrack[]> =>
    proxyFetch<{ Items?: AlbumTrack[] }>(
      `/Users/${userId}/Items?ParentId=${albumId}&SortBy=ParentIndexNumber,IndexNumber&Fields=Artists,ArtistItems,RunTimeTicks`,
      url,
      apiKey,
      { Items: [] },
    ).then((data) => data.Items || []),
}
