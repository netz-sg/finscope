import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '../../store/useToastStore'
import { GLASS_PANEL } from '../../design/tokens'

const ICON_MAP = {
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const cfg = ICON_MAP[t.type]
  const Icon = cfg.icon

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const fadeTimer = setTimeout(() => setVisible(false), t.duration - 400)
    return () => clearTimeout(fadeTimer)
  }, [t.duration])

  return (
    <div
      className={`${GLASS_PANEL} rounded-2xl p-4 pr-3 flex items-center gap-3 border ${cfg.border} min-w-[280px] max-w-[400px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={cfg.color} />
      </div>
      <p className="text-sm font-medium text-white/90 flex-1 leading-snug">{t.message}</p>
      <button
        onClick={onDismiss}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-auto sm:bottom-8 sm:right-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  )
}
