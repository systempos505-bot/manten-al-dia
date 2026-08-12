import { useMemo, useState } from 'react'

export const REPORT_RANGES = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

export function useReportRange(defaultDays = 30) {
  const [days, setDays] = useState(defaultDays)
  const range = useMemo(() => {
    const from = new Date()
    from.setDate(from.getDate() - (days - 1))
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [days])

  return { days, setDays, range }
}
