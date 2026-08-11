export function formatCurrency(amount: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0)
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-MX', opts ?? { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}
