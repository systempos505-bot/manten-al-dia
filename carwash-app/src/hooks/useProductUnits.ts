import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ProductUnit } from '../types/database'

export function useProductUnits(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['product_units', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('product_units')
        .select('*')
        .eq('business_id', businessId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as ProductUnit[]
    },
  })
}

export function useSaveProductUnit() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ProductUnit> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('product_units').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('product_units').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_units'] }),
  })
}

export function useDeleteProductUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_units').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_units'] }),
  })
}
