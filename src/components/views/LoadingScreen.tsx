import { Radio } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans text-white">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] animate-pulse">
          <Radio size={32} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-black tracking-tighter">FINSCOPE</h1>
          <p className="text-white/30 text-[10px] font-mono tracking-widest uppercase">
            Floating Telemetry
          </p>
        </div>
      </div>
    </div>
  )
}
