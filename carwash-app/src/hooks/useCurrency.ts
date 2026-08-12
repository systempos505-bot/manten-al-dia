import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/format'

export const CURRENCY_OPTIONS = [
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'USD', label: 'USD — Dólar estadounidense' },
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'GTQ', label: 'GTQ — Quetzal guatemalteco' },
  { code: 'HNL', label: 'HNL — Lempira hondureña' },
  { code: 'NIO', label: 'NIO — Córdoba nicaragüense' },
  { code: 'CRC', label: 'CRC — Colón costarricense' },
  { code: 'PAB', label: 'PAB — Balboa panameño' },
  { code: 'DOP', label: 'DOP — Peso dominicano' },
  { code: 'BOB', label: 'BOB — Boliviano' },
  { code: 'PYG', label: 'PYG — Guaraní paraguayo' },
  { code: 'UYU', label: 'UYU — Peso uruguayo' },
  { code: 'VES', label: 'VES — Bolívar venezolano' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — Libra esterlina' },
  { code: 'CAD', label: 'CAD — Dólar canadiense' },
]

export function useFormatCurrency() {
  const { currency } = useAuth()
  return useCallback((amount: number) => formatCurrency(amount, currency), [currency])
}
