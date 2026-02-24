import { getMediaTypeConfig } from '../../utils/mediaTypes'

interface MediaBadgeProps {
  type: string
  className?: string
}

export default function MediaBadge({ type, className = '' }: MediaBadgeProps) {
  const config = getMediaTypeConfig(type)
  const Icon = config.icon

  return (
    <span
      className={`flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border} ${className}`}
    >
      <Icon size={12} className="mr-1.5" />
      {config.label}
    </span>
  )
}
