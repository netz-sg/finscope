import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Bell, CheckCheck, Play, Square, AlertTriangle, Zap, Trash2 } from 'lucide-react'
import { useNotificationStore } from '../../store/useNotificationStore'
import { NotificationsAPI } from '../../api/notifications'
import { toast } from '../../store/useToastStore'
import { GLASS_PANEL, GLASS_INNER, TRANSITION } from '../../design/tokens'

const eventIcons: Record<string, typeof Play> = {
  stream_start: Play,
  stream_end: Square,
  transcode_load: Zap,
  concurrent_threshold: AlertTriangle,
  server_error: AlertTriangle,
}

const eventColors: Record<string, string> = {
  stream_start: 'text-green-400',
  stream_end: 'text-indigo-400',
  transcode_load: 'text-amber-400',
  concurrent_threshold: 'text-red-400',
  server_error: 'text-red-400',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

async function refreshFromServer(
  setNotifications: (items: import('../../types/app').NotificationItem[]) => void,
  setUnreadCount: (n: number) => void,
) {
  const [items, count] = await Promise.all([
    NotificationsAPI.getLog(50),
    NotificationsAPI.getUnreadCount(),
  ])
  setNotifications(items)
  setUnreadCount(count)
}

export default function NotificationPanel() {
  const { t } = useTranslation()
  const { notifications, panelOpen, setPanelOpen, setNotifications, setUnreadCount } = useNotificationStore()
  const [confirmClear, setConfirmClear] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!panelOpen) { setConfirmClear(false); return }
    refreshFromServer(setNotifications, setUnreadCount)
  }, [panelOpen, setNotifications, setUnreadCount])

  const handleMarkAllRead = async () => {
    setLoading(true)
    const ok = await NotificationsAPI.markRead()
    if (ok) {
      await refreshFromServer(setNotifications, setUnreadCount)
    } else {
      toast.error('Failed to mark notifications as read')
    }
    setLoading(false)
  }

  const handleDeleteAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setLoading(true)
    const ok = await NotificationsAPI.deleteAll()
    if (ok) {
      await refreshFromServer(setNotifications, setUnreadCount)
      setConfirmClear(false)
    } else {
      toast.error('Failed to delete notifications')
    }
    setLoading(false)
  }

  const handleDeleteOne = async (id: number) => {
    const ok = await NotificationsAPI.deleteOne(id)
    if (ok) {
      await refreshFromServer(setNotifications, setUnreadCount)
    } else {
      toast.error('Failed to delete notification')
    }
  }

  if (!panelOpen) return null

  const hasUnread = notifications.some((n) => !n.isRead)
  const hasAny = notifications.length > 0

  return (
    <>
      <div className="fixed inset-0 z-[90] pointer-events-auto" onClick={() => setPanelOpen(false)} />
      <div className={`fixed top-16 right-4 sm:right-6 md:right-8 w-[380px] max-h-[70vh] z-[100] pointer-events-auto ${GLASS_PANEL} rounded-2xl flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-white/60" />
            <h3 className="text-sm font-bold text-white/80">{t('notifications.title')}</h3>
            {hasAny && (
              <span className="text-[10px] font-mono text-white/25 ml-1">{notifications.length}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                title={t('notifications.markAllRead')}
                className={`p-1.5 rounded-lg text-white/40 hover:text-sky-400 hover:bg-sky-400/10 disabled:opacity-30 ${TRANSITION}`}
              >
                <CheckCheck size={14} />
              </button>
            )}
            {hasAny && (
              <button
                onClick={handleDeleteAll}
                disabled={loading}
                title={t('notifications.deleteAll')}
                className={`p-1.5 rounded-lg disabled:opacity-30 ${TRANSITION} ${
                  confirmClear
                    ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20'
                    : 'text-white/40 hover:text-red-400 hover:bg-red-400/10'
                }`}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              className={`p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] ${TRANSITION}`}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {confirmClear && (
          <div className="px-4 py-2.5 bg-red-500/[0.06] border-b border-red-400/10 flex items-center justify-between">
            <span className="text-xs text-red-300">{t('notifications.confirmDeleteAll')}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfirmClear(false)}
                className="text-[10px] px-2.5 py-1 rounded-md text-white/50 hover:bg-white/5"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={loading}
                className="text-[10px] px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-30"
              >
                {t('notifications.deleteAll')}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Bell size={28} className="text-white/10" />
              <p className="text-xs text-white/25">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => {
                const Icon = eventIcons[n.eventType] || Bell
                const color = eventColors[n.eventType] || 'text-white/50'
                return (
                  <div
                    key={n.id}
                    className={`group p-4 flex gap-3 ${!n.isRead ? 'bg-white/[0.02]' : ''} ${TRANSITION} hover:bg-white/[0.04]`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${GLASS_INNER} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white/80 truncate">{n.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] text-white/25 font-mono">{timeAgo(n.createdAt)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteOne(n.id) }}
                            className={`p-0.5 rounded opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 ${TRANSITION}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
