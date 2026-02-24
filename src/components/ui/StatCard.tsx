import { GLASS_PANEL, GLASS_PANEL_HOVER, TRANSITION } from '../../design/tokens'

interface StatCardProps {
  value: string | number
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  iconBg?: string
  onClick?: () => void
  highlight?: boolean
  badge?: React.ReactNode
}

export default function StatCard({
  value,
  label,
  icon: Icon,
  iconColor = 'text-white/40',
  iconBg = 'bg-white/5',
  onClick,
  highlight,
  badge,
}: StatCardProps) {
  const highlightClasses = highlight
    ? `bg-green-500/[0.05] border border-green-500/[0.2] border-t-green-500/[0.3] shadow-[0_0_30px_rgba(34,197,94,0.1),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:bg-green-500/[0.08] hover:-translate-y-1.5 ${TRANSITION}`
    : `${GLASS_PANEL} ${GLASS_PANEL_HOVER}`

  return (
    <div
      className={`rounded-[2.5rem] p-6 flex flex-col justify-between cursor-pointer ${highlightClasses}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}
        >
          <Icon size={24} />
        </div>
        {badge}
      </div>
      <div>
        <p className="text-4xl font-black mb-1">{value}</p>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}
