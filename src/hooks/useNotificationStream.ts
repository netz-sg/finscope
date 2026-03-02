import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { toast } from '../store/useToastStore'
import type { StreamMeta } from '../types/app'

export function useNotificationStream() {
  const status = useAppStore((s) => s.status)
  const isDemoMode = useAppStore((s) => s.isDemoMode)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status !== 'success' || isDemoMode) return

    const token = localStorage.getItem('finscope_session_token')
    if (!token) return

    const handleMessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as {
          eventType: string
          title: string
          message: string
          meta?: StreamMeta
        }
        if (event.meta) {
          toast.stream(event.message, event.eventType, event.meta)
        } else {
          toast.info(`${event.title} — ${event.message}`)
        }
        setUnreadCount(useNotificationStore.getState().unreadCount + 1)
      } catch {}
    }

    const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`)
    esRef.current = es
    es.onmessage = handleMessage

    es.onerror = () => {
      es.close()
      setTimeout(() => {
        if (useAppStore.getState().status === 'success') {
          const reconnect = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`)
          esRef.current = reconnect
          reconnect.onmessage = handleMessage
        }
      }, 5000)
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [status, isDemoMode, setUnreadCount])
}
