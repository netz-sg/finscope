import { create } from 'zustand'
import type { NotificationSettings, NotificationItem, WebhookConfig } from '../types/app'

interface NotificationState {
  unreadCount: number
  notifications: NotificationItem[]
  settings: NotificationSettings
  webhooks: WebhookConfig[]
  panelOpen: boolean

  setUnreadCount: (count: number) => void
  setNotifications: (items: NotificationItem[]) => void
  setSettings: (settings: NotificationSettings) => void
  setWebhooks: (webhooks: WebhookConfig[]) => void
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  settings: {
    streamStart: true,
    streamEnd: true,
    transcodeLoad: false,
    serverError: true,
    thresholdConcurrent: 5,
    thresholdTranscode: 3,
  },
  webhooks: [],
  panelOpen: false,

  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setNotifications: (notifications) => set({ notifications }),
  setSettings: (settings) => set({ settings }),
  setWebhooks: (webhooks) => set({ webhooks }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}))
