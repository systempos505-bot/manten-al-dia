import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ProductCategory } from '../types/database'

export function useProductCategories(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['product_categories', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('product_categories')
        .select('*')
        .eq('business_id', businessId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as ProductCategory[]
    },
  })
}

export function useSaveProductCategory() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ProductCategory> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('product_categories').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('product_categories').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_categories'] }),
  })
}

export function useDeleteProductCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_categories'] }),
  })
}
