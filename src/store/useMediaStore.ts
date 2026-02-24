import { create } from 'zustand'
import type { Session, JellyfinUser, ItemCounts, NewsItem, NowPlayingItem, GenreCount, PulseStats } from '../types/jellyfin'
import type { AnalyticsData, LibraryData } from '../types/app'

interface MediaState {
  sessions: Session[]
  users: JellyfinUser[]
  counts: ItemCounts | null
  libraryData: LibraryData
  analyticsData: AnalyticsData
  genreData: GenreCount[]
  pulseStats: PulseStats | null
  news: NewsItem[]
  heroItems: NowPlayingItem[]

  setSessions: (sessions: Session[]) => void
  setUsers: (users: JellyfinUser[]) => void
  setCounts: (counts: ItemCounts | null) => void
  setLibraryData: (data: LibraryData) => void
  setAnalyticsData: (data: AnalyticsData) => void
  setGenreData: (data: GenreCount[]) => void
  setPulseStats: (data: PulseStats) => void
  setNews: (news: NewsItem[]) => void
  setHeroItems: (items: NowPlayingItem[]) => void
  resetMedia: () => void
}

const initialState = {
  sessions: [],
  users: [],
  counts: null,
  libraryData: { mostPlayed: [], latest: [], libraries: [] },
  analyticsData: { historyMap: {}, peakHours: Array(24).fill(0) as number[], clients: {} },
  genreData: [] as GenreCount[],
  pulseStats: null as PulseStats | null,
  news: [],
  heroItems: [],
}

export const useMediaStore = create<MediaState>((set) => ({
  ...initialState,

  setSessions: (sessions) => set({ sessions }),
  setUsers: (users) => set({ users }),
  setCounts: (counts) => set({ counts }),
  setLibraryData: (libraryData) => set({ libraryData }),
  setAnalyticsData: (analyticsData) => set({ analyticsData }),
  setGenreData: (genreData) => set({ genreData }),
  setPulseStats: (pulseStats) => set({ pulseStats }),
  setNews: (news) => set({ news }),
  setHeroItems: (heroItems) => set({ heroItems }),
  resetMedia: () => set(initialState),
}))
