import { create } from 'zustand'
import type { NowPlayingItem, NewsItem } from '../types/jellyfin'

interface UIState {
  selectedItem: NowPlayingItem | null
  selectedNews: NewsItem | null
  heroIndex: number
  currentTime: number
  showOnboardingTour: boolean

  setSelectedItem: (item: NowPlayingItem | null) => void
  setSelectedNews: (news: NewsItem | null) => void
  setHeroIndex: (index: number) => void
  incrementHeroIndex: () => void
  setCurrentTime: (time: number) => void
  setShowOnboardingTour: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedItem: null,
  selectedNews: null,
  heroIndex: 0,
  currentTime: Date.now(),
  showOnboardingTour: false,

  setSelectedItem: (selectedItem) => set({ selectedItem }),
  setSelectedNews: (selectedNews) => set({ selectedNews }),
  setHeroIndex: (heroIndex) => set({ heroIndex }),
  incrementHeroIndex: () => set((state) => ({ heroIndex: state.heroIndex + 1 })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setShowOnboardingTour: (showOnboardingTour) => set({ showOnboardingTour }),
}))
