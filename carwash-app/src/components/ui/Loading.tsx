import { Loader2 } from 'lucide-react'

export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  )
}
