import { REPORT_RANGES } from '../../hooks/useReportRange'

export function RangeSwitcher({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <div className="mb-5 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
      {REPORT_RANGES.map((r) => (
        <button
          key={r.days}
          onClick={() => onChange(r.days)}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${days === r.days ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
