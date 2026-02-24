import { useState } from 'react'

interface HeroTitleBoxProps {
  title: string
  logoUrl?: string
}

export default function HeroTitleBox({ title, logoUrl }: HeroTitleBoxProps) {
  const [imgError, setImgError] = useState(false)

  if (!imgError && logoUrl && !logoUrl.includes('error')) {
    return (
      <img
        src={logoUrl}
        alt={title}
        className="max-h-24 md:max-h-32 w-auto object-contain mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-4 leading-tight max-w-4xl text-balance">
      {title}
    </h2>
  )
}
