import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface SearchSelectOption {
  id: string
  label: string
}

interface SearchSelectProps {
  value: string
  onChange: (id: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  emptyOptionLabel?: string
  className?: string
}

export function SearchSelect({ value, onChange, options, placeholder = 'Buscar...', emptyOptionLabel = 'Sin asignar', className }: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.id === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function openDropdown() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-left text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
      >
        <span className={selected ? '' : 'text-slate-400'}>{selected ? selected.label : emptyOptionLabel}</span>
        <ChevronDown size={15} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search size={14} className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select('')}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
              >
                {emptyOptionLabel}
                {!value && <Check size={14} className="text-brand-600" />}
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => select(o.id)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-800 hover:bg-brand-50"
                >
                  {o.label}
                  {value === o.id && <Check size={14} className="text-brand-600" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3.5 py-3 text-sm text-slate-400">Sin resultados.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
