import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { CatalogItemType, PaymentMethod, Sale } from '../types/database'

export interface SaleDraftItem {
  item_id: string
  item_name: string
  item_type: CatalogItemType
  qty: number
  unit_price: number
  commission_pct: number
}

export interface SalePaymentDraft {
  method: PaymentMethod
  currency: string
  amount: number
  amount_main: number
}

export interface CreateSaleInput {
  client_id: string | null
  vehicle_id: string | null
  employee_id: string | null
  appointment_id: string | null
  bay_id: string | null
  payment_method: PaymentMethod
  discount: number
  items: SaleDraftItem[]
  payments?: SalePaymentDraft[]
}

export function useSales(limit = 100) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['sales', businessId, limit],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, client:clients(full_name), employee:employees(full_name), sale_items(*)')
        .eq('business_id', businessId!)
        .order('sale_date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as any[]
    },
  })
}

export function useCreateSale() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const subtotal = input.items.reduce((sum, it) => sum + it.qty * it.unit_price, 0)
      const total = Math.max(subtotal - input.discount, 0)

      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          client_id: input.client_id,
          vehicle_id: input.vehicle_id,
          employee_id: input.employee_id,
          appointment_id: input.appointment_id,
          bay_id: input.bay_id,
          payment_method: input.payment_method,
          subtotal,
          discount: input.discount,
          total,
          status: 'completada',
          created_by: user?.id,
        })
        .select()
        .single()
      if (error) throw error

      const rows = input.items.map((it) => ({
        sale_id: sale.id,
        item_id: it.item_id,
        item_name: it.item_name,
        item_type: it.item_type,
        qty: it.qty,
        unit_price: it.unit_price,
        subtotal: it.qty * it.unit_price,
        commission_pct: it.commission_pct,
        commission_amount: (it.qty * it.unit_price * it.commission_pct) / 100,
      }))
      const { error: itemsError } = await supabase.from('sale_items').insert(rows)
      if (itemsError) throw itemsError

      if (input.payments && input.payments.length > 0) {
        const paymentRows = input.payments.map((p) => ({
          sale_id: sale.id,
          method: p.method,
          currency: p.currency,
          amount: p.amount,
          amount_main: p.amount_main,
        }))
        const { error: paymentsError } = await supabase.from('sale_payments').insert(paymentRows)
        if (paymentsError) throw paymentsError
      }

      if (input.appointment_id) {
        await supabase.from('appointments').update({ status: 'completada' }).eq('id', input.appointment_id)
      }

      return sale as Sale
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['catalog_items'] })
      qc.invalidateQueries({ queryKey: ['cash_movements'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
