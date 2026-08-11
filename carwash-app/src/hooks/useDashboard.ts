import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useDashboardData(range: { from: string; to: string }) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['dashboard', businessId, range.from, range.to],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const [salesRes, expensesRes, appointmentsRes, lowStockRes] = await Promise.all([
        supabase
          .from('sales')
          .select('id, total, sale_date, payment_method, employee_id, employee:employees(full_name), sale_items(item_name, item_type, qty, subtotal, commission_amount)')
          .eq('business_id', businessId!)
          .eq('status', 'completada')
          .gte('sale_date', range.from)
          .lte('sale_date', range.to),
        supabase
          .from('expenses')
          .select('id, amount, category, expense_date')
          .eq('business_id', businessId!)
          .gte('expense_date', range.from.slice(0, 10))
          .lte('expense_date', range.to.slice(0, 10)),
        supabase
          .from('appointments')
          .select('id, status, scheduled_at')
          .eq('business_id', businessId!)
          .gte('scheduled_at', range.from)
          .lte('scheduled_at', range.to),
        supabase
          .from('catalog_items')
          .select('id, name, stock_qty, min_stock, unit')
          .eq('business_id', businessId!)
          .eq('track_inventory', true)
          .order('stock_qty', { ascending: true }),
      ])

      if (salesRes.error) throw salesRes.error
      if (expensesRes.error) throw expensesRes.error
      if (appointmentsRes.error) throw appointmentsRes.error
      if (lowStockRes.error) throw lowStockRes.error

      const sales = salesRes.data as any[]
      const expenses = expensesRes.data as any[]
      const appointments = appointmentsRes.data as any[]
      const lowStock = (lowStockRes.data as any[]).filter((i) => i.stock_qty <= i.min_stock)

      const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

      const byDay = new Map<string, number>()
      for (const s of sales) {
        const day = String(s.sale_date).slice(0, 10)
        byDay.set(day, (byDay.get(day) || 0) + Number(s.total))
      }
      const salesByDay = Array.from(byDay.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const byEmployee = new Map<string, { name: string; total: number; commission: number }>()
      for (const s of sales) {
        const key = s.employee_id || 'sin-asignar'
        const name = s.employee?.full_name || 'Sin asignar'
        const entry = byEmployee.get(key) || { name, total: 0, commission: 0 }
        entry.total += Number(s.total)
        entry.commission += (s.sale_items || []).reduce((sum: number, it: any) => sum + Number(it.commission_amount), 0)
        byEmployee.set(key, entry)
      }

      const byItem = new Map<string, { name: string; qty: number; total: number }>()
      for (const s of sales) {
        for (const it of s.sale_items || []) {
          const entry = byItem.get(it.item_name) || { name: it.item_name, qty: 0, total: 0 }
          entry.qty += Number(it.qty)
          entry.total += Number(it.subtotal)
          byItem.set(it.item_name, entry)
        }
      }
      const topItems = Array.from(byItem.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)

      const byExpenseCategory = new Map<string, number>()
      for (const e of expenses) {
        byExpenseCategory.set(e.category, (byExpenseCategory.get(e.category) || 0) + Number(e.amount))
      }

      return {
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        salesCount: sales.length,
        appointmentsCount: appointments.length,
        appointmentsPending: appointments.filter((a) => a.status === 'pendiente' || a.status === 'confirmada').length,
        salesByDay,
        byEmployee: Array.from(byEmployee.values()).sort((a, b) => b.total - a.total),
        topItems,
        byExpenseCategory: Array.from(byExpenseCategory.entries()).map(([category, total]) => ({ category, total })),
        lowStock,
      }
    },
  })
}
