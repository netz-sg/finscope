import type { NotificationSettings, NotificationItem, WebhookConfig } from '../types/app'

const getToken = () => localStorage.getItem('finscope_session_token')

const getAuthHeaders = (): Record<string, string> => {
  const token = getToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export const NotificationsAPI = {
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const res = await fetch('/api/notifications/settings', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error()
      return await res.json()
    } catch {
      return { streamStart: true, streamEnd: true, transcodeLoad: false, serverError: true, thresholdConcurrent: 5, thresholdTranscode: 3 }
    }
  },

  saveSettings: async (settings: NotificationSettings): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      })
      return res.ok
    } catch {
      return false
    }
  },

  getLog: async (limit = 50, offset = 0): Promise<NotificationItem[]> => {
    try {
      const res = await fetch(`/api/notifications/log?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  markRead: async (ids?: number[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      })
      return res.ok
    } catch {
      return false
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await fetch('/api/notifications/unread-count', { headers: getAuthHeaders() })
      if (!res.ok) return 0
      const data = await res.json()
      return data.count ?? 0
    } catch {
      return 0
    }
  },

  getLatestSince: async (since: string): Promise<NotificationItem[]> => {
    try {
      const res = await fetch(`/api/notifications/latest?since=${encodeURIComponent(since)}`, { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  deleteAll: async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE', headers: getAuthHeaders() })
      return res.ok
    } catch {
      return false
    }
  },

  deleteOne: async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      return res.ok
    } catch {
      return false
    }
  },

  getWebhooks: async (): Promise<WebhookConfig[]> => {
    try {
      const res = await fetch('/api/webhooks', { headers: getAuthHeaders() })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  createWebhook: async (data: { name: string; platform: string; webhookUrl: string }): Promise<WebhookConfig | null> => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  updateWebhook: async (id: number, data: Partial<WebhookConfig>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return res.ok
    } catch {
      return false
    }
  },

  deleteWebhook: async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return res.ok
    } catch {
      return false
    }
  },

  testWebhook: async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!res.ok) return false
      const data = await res.json()
      return data.success
    } catch {
      return false
    }
  },
}
