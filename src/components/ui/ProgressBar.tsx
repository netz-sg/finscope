interface ProgressBarProps {
  progress: number
  type?: string
  className?: string
}

const getBarColor = (type?: string): string => {
  switch (type) {
    case 'Audio':
      return 'bg-pink-500'
    case 'Episode':
    case 'Series':
      return 'bg-purple-500'
    case 'Movie':
      return 'bg-blue-500'
    default:
      return 'bg-green-400'
  }
}

export default function ProgressBar({ progress, type, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 w-full bg-black/50 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full relative ${getBarColor(type)}`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white/50 to-transparent" />
      </div>
    </div>
  )
}
