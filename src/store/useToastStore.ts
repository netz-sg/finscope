import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type, duration = 4000) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

/** Shorthand toast functions */
export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, 'success'),
  error: (message: string) => useToastStore.getState().addToast(message, 'error', 6000),
  info: (message: string) => useToastStore.getState().addToast(message, 'info'),
}
