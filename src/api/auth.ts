const getToken = () => localStorage.getItem('finscope_session_token')

const authFetch = async (url: string, options?: RequestInit) => {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(url, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  })
}

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      res.status >= 500
        ? 'Server is starting up — please try again in a moment'
        : `Unexpected response (${res.status})`,
    )
  }
}

export const AuthAPI = {
  getSetupStatus: async (): Promise<{ setupComplete: boolean; hasUsers: boolean }> => {
    const res = await fetch('/api/setup/status')
    return safeJson(res)
  },

  register: async (
    username: string,
    password: string,
  ): Promise<{
    user: { id: string; username: string; displayName: string; avatarUrl: string | null; role: string }
    token: string
    expiresAt: string
    error?: string
  }> => {
    const res = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    return safeJson(res)
  },

  login: async (
    username: string,
    password: string,
  ): Promise<{
    user?: { id: string; username: string; displayName: string; avatarUrl: string | null; role: string }
    token?: string
    expiresAt?: string
    error?: string
  }> => {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    return safeJson(res)
  },

  logout: async (): Promise<void> => {
    await authFetch('/api/auth/logout', { method: 'POST' })
  },

  getMe: async (): Promise<{
    user: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
      role: string
      createdAt: string
    }
    jellyfinConfig: {
      serverUrl: string
      apiKeyMasked: string
      jellyfinUserId: string
      serverName: string
    } | null
  }> => {
    const res = await authFetch('/api/auth/me')
    if (!res.ok) throw new Error('Unauthorized')
    return safeJson(res)
  },

  updateProfile: async (data: { username?: string; displayName?: string }): Promise<{
    user?: { id: string; username: string; displayName: string; avatarUrl: string | null; role: string }
    error?: string
  }> => {
    const res = await authFetch('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return safeJson(res)
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success?: boolean; error?: string }> => {
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return safeJson(res)
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await authFetch('/api/auth/avatar', {
      method: 'POST',
      body: fd,
    })
    return safeJson(res)
  },

  removeAvatar: async (): Promise<void> => {
    await authFetch('/api/auth/avatar', { method: 'DELETE' })
  },

  saveJellyfinConfig: async (
    serverUrl: string,
    apiKey: string,
  ): Promise<{ success?: boolean; serverName?: string; jellyfinUserId?: string; error?: string }> => {
    const res = await authFetch('/api/jellyfin-config', {
      method: 'POST',
      body: JSON.stringify({ serverUrl, apiKey }),
    })
    return safeJson(res)
  },
}
