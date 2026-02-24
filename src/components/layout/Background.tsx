interface BackgroundProps {
  imageUrl?: string
  isDemo?: boolean
}

const DEMO_BG = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1920'

export default function Background({ imageUrl, isDemo }: BackgroundProps) {
  const bgSrc = isDemo ? DEMO_BG : imageUrl

  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{ opacity: bgSrc ? 0.3 : 0.05 }}
      >
        {bgSrc && (
          <img
            src={bgSrc}
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/40 via-[#020202]/80 to-[#020202]" />
      </div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
    </>
  )
}
