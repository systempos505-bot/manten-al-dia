import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Purchase } from '../types/database'

export interface PurchaseDraftItem {
  item_id: string
  qty: number
  unit_cost: number
}

export function usePurchases() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['purchases', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, purchase_items(*, catalog_items(name, unit))')
        .eq('business_id', businessId!)
        .order('purchase_date', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as (Purchase & { purchase_items: any[] })[]
    },
  })
}

export function useCreatePurchase() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { supplier_name: string; purchase_date: string; notes: string; items: PurchaseDraftItem[] }) => {
      const total = input.items.reduce((sum, it) => sum + it.qty * it.unit_cost, 0)
      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert({
          business_id: businessId,
          supplier_name: input.supplier_name,
          purchase_date: input.purchase_date,
          notes: input.notes,
          total,
          created_by: user?.id,
        })
        .select()
        .single()
      if (error) throw error

      const rows = input.items.map((it) => ({
        purchase_id: purchase.id,
        item_id: it.item_id,
        qty: it.qty,
        unit_cost: it.unit_cost,
        subtotal: it.qty * it.unit_cost,
      }))
      const { error: itemsError } = await supabase.from('purchase_items').insert(rows)
      if (itemsError) throw itemsError

      return purchase as Purchase
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['catalog_items'] })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['cash_movements'] })
    },
  })
}
