import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { CatalogItem, CatalogItemType } from '../types/database'

export function useCatalogItems(type?: CatalogItemType) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['catalog_items', businessId, type ?? 'all'],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('catalog_items')
        .select('*')
        .eq('business_id', businessId!)
        .order('name', { ascending: true })
      if (type) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error
      return data as CatalogItem[]
    },
  })
}

export function useSaveCatalogItem() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<CatalogItem> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('catalog_items').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('catalog_items').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog_items'] }),
  })
}

export function useDeleteCatalogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('catalog_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog_items'] }),
  })
}
