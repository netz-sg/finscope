import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'
import { useAppStore } from '../store/useAppStore'

export const useHeroRotation = () => {
  const status = useAppStore((s) => s.status)
  const incrementHeroIndex = useUIStore((s) => s.incrementHeroIndex)

  useEffect(() => {
    if (status !== 'success') return
    const interval = setInterval(incrementHeroIndex, 8000)
    return () => clearInterval(interval)
  }, [status, incrementHeroIndex])
}
