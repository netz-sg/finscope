import { useState } from 'react'

interface CoverArtProps {
  url?: string
  title: string
  isDemo?: boolean
  type?: string
  className?: string
}

const FALLBACK_VIDEO = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900'
const FALLBACK_AUDIO = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600&h=600'

export default function CoverArt({ url, title, isDemo, type, className = '' }: CoverArtProps) {
  const [error, setError] = useState(false)
  const isAudio = type === 'Audio' || type === 'MusicAlbum'
  const finalUrl = isDemo || error || !url
    ? (isAudio ? FALLBACK_AUDIO : FALLBACK_VIDEO)
    : url

  return (
    <div
      className={`relative overflow-hidden bg-neutral-900 rounded-2xl shadow-2xl ${className}`}
    >
      <img
        src={finalUrl}
        alt={title}
        onError={() => setError(true)}
        className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
