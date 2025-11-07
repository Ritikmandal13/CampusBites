import { twMerge } from 'tailwind-merge'

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={twMerge('inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-foreground', className)}>
      {children}
    </span>
  )
}


