import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Client, Vehicle } from '../types/database'

export function useClients(search = '') {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['clients', businessId, search],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessId!)
        .order('full_name', { ascending: true })
      if (search) query = query.ilike('full_name', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useClientVehicles(clientId: string | null) {
  return useQuery({
    queryKey: ['vehicles', 'by-client', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Vehicle[]
    },
  })
}

export function useSaveClient() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Client> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('clients').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clients').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useSaveVehicle() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Vehicle> & { id?: string; client_id: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('vehicles').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vehicles').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicles', 'by-client', vars.client_id] })
      qc.invalidateQueries({ queryKey: ['vehicles', 'all'] })
    },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; client_id: string }) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicles', 'by-client', vars.client_id] })
      qc.invalidateQueries({ queryKey: ['vehicles', 'all'] })
    },
  })
}

export function useAllVehicles(search = '') {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['vehicles', 'all', businessId, search],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('*, client:clients(id, full_name, phone)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
      if (search) query = query.or(`plate.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as (Vehicle & { client: Pick<Client, 'id' | 'full_name' | 'phone'> | null })[]
    },
  })
}
