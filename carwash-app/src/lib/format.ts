import { format as formatWithPattern } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateFormat, TimeFormat } from '../types/database'

const DATE_PATTERNS: Record<DateFormat, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
}

const TIME_PATTERNS: Record<TimeFormat, string> = {
  '24h': 'HH:mm',
  '12h': 'hh:mm a',
}

let currentDateFormat: DateFormat = 'DD/MM/YYYY'
let currentTimeFormat: TimeFormat = '24h'

export function setDateTimeFormat(dateFormat: DateFormat, timeFormat: TimeFormat) {
  currentDateFormat = dateFormat
  currentTimeFormat = timeFormat
}

export function formatCurrency(amount: number, currency = 'MXN', decimals = 2) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0)
}

export function formatQuantity(amount: number, decimals = 2) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount || 0)
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (opts) return new Intl.DateTimeFormat('es-MX', opts).format(date)
  return formatWithPattern(date, DATE_PATTERNS[currentDateFormat], { locale: es })
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const pattern = `${DATE_PATTERNS[currentDateFormat]} ${TIME_PATTERNS[currentTimeFormat]}`
  return formatWithPattern(date, pattern, { locale: es })
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}
