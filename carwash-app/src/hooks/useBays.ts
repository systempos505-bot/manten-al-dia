import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Bay } from '../types/database'

export function useBays(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['bays', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('bays')
        .select('*')
        .eq('business_id', businessId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as Bay[]
    },
  })
}

export function useSaveBay() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Bay> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('bays').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('bays').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bays'] }),
  })
}

export function useDeleteBay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bays').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bays'] }),
  })
}
