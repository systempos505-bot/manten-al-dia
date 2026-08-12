import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { VehicleTypeItem } from '../types/database'

export function useVehicleTypes(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['vehicle_types', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('vehicle_types')
        .select('*')
        .eq('business_id', businessId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as VehicleTypeItem[]
    },
  })
}

export function useSaveVehicleType() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<VehicleTypeItem> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('vehicle_types').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vehicle_types').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle_types'] }),
  })
}

export function useDeleteVehicleType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicle_types').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicle_types'] }),
  })
}
