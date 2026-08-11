import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'blue'

const toneClasses: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', toneClasses[tone])}>
      {children}
    </span>
  )
}
