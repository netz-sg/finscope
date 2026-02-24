import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'
import { useAppStore } from '../store/useAppStore'

export const useTickTimer = () => {
  const status = useAppStore((s) => s.status)
  const setCurrentTime = useUIStore((s) => s.setCurrentTime)

  useEffect(() => {
    if (status !== 'success') return
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [status, setCurrentTime])
}
