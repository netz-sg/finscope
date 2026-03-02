import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useMediaStore } from '../store/useMediaStore'
import type { Session } from '../types/jellyfin'

export function useJellyfinStream() {
  const status = useAppStore((s) => s.status)
  const isDemoMode = useAppStore((s) => s.isDemoMode)
  const setSessions = useMediaStore((s) => s.setSessions)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status !== 'success' || isDemoMode) return

    const token = localStorage.getItem('finscope_session_token')
    if (!token) return

    const connect = () => {
      const es = new EventSource(`/api/jellyfin/stream?token=${encodeURIComponent(token)}`)
      esRef.current = es

      es.onmessage = (e: MessageEvent) => {
        try {
          const { type, data } = JSON.parse(e.data) as { type: string; data: Session[] }
          if (type === 'sessions') {
            setSessions(data.filter((s) => s.NowPlayingItem != null))
          }
        } catch { /* noop */ }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        setTimeout(() => {
          if (useAppStore.getState().status === 'success') connect()
        }, 5000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
    }
  }, [status, isDemoMode, setSessions])
}
