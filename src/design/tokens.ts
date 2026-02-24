export const TRANSITION =
  'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'

export const GLASS_PANEL = [
  'bg-white/[0.03]',
  'backdrop-blur-[40px]',
  'border border-white/[0.08] border-t-white/[0.15]',
  'shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
  TRANSITION,
].join(' ')

export const GLASS_PANEL_HOVER = [
  'hover:bg-white/[0.06]',
  'hover:shadow-[0_16px_40px_0_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]',
  'hover:-translate-y-1.5',
  'cursor-pointer',
].join(' ')

export const GLASS_INNER = [
  'bg-white/[0.02]',
  'backdrop-blur-xl',
  'border border-white/[0.05] border-t-white/[0.08]',
  'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]',
  TRANSITION,
].join(' ')
