import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Appointment, AppointmentStatus } from '../types/database'

export interface AppointmentWithRelations extends Appointment {
  client: { id: string; full_name: string; phone: string | null } | null
  vehicle: { id: string; brand: string | null; model: string | null; plate: string | null } | null
  employee: { id: string; full_name: string } | null
  bay: { id: string; name: string } | null
  appointment_items: { item_id: string; qty: number; catalog_items: { name: string } | null }[]
}

export function useAppointments(range?: { from: string; to: string }) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['appointments', businessId, range?.from, range?.to],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(
          '*, client:clients(id, full_name, phone), vehicle:vehicles(id, brand, model, plate), employee:employees(id, full_name), bay:bays(id, name), appointment_items(item_id, qty, catalog_items(name))',
        )
        .eq('business_id', businessId!)
        .order('scheduled_at', { ascending: true })
      if (range) query = query.gte('scheduled_at', range.from).lte('scheduled_at', range.to)
      const { data, error } = await query
      if (error) throw error
      return data as unknown as AppointmentWithRelations[]
    },
  })
}

// Sesiones de bahía activas (no completadas ni canceladas), sin importar la
// fecha agendada — para el tablero visual de bahías en el Punto de Venta / Citas.
export function useActiveBayAppointments() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['appointments', 'active_bays', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          '*, client:clients(id, full_name, phone), vehicle:vehicles(id, brand, model, plate), employee:employees(id, full_name), bay:bays(id, name), appointment_items(item_id, qty, catalog_items(name))',
        )
        .eq('business_id', businessId!)
        .not('bay_id', 'is', null)
        .in('status', ['pendiente', 'confirmada', 'en_espera', 'en_proceso', 'listo'])
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return data as unknown as AppointmentWithRelations[]
    },
  })
}

export function useSaveAppointment() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Partial<Appointment> & {
        id?: string
        service_item_id?: string | null
        items?: { item_id: string; qty: number }[]
      },
    ) => {
      const { id, service_item_id, items, ...rest } = input
      if (id) {
        const { error } = await supabase.from('appointments').update(rest).eq('id', id)
        if (error) throw error
        if (items) {
          await supabase.from('appointment_items').delete().eq('appointment_id', id)
          if (items.length > 0) {
            await supabase.from('appointment_items').insert(items.map((it) => ({ appointment_id: id, item_id: it.item_id, qty: it.qty })))
          }
        } else if (service_item_id) {
          await supabase.from('appointment_items').delete().eq('appointment_id', id)
          await supabase.from('appointment_items').insert({ appointment_id: id, item_id: service_item_id, qty: 1 })
        }
        return { id }
      } else {
        const { data, error } = await supabase
          .from('appointments')
          .insert({ ...rest, business_id: businessId, created_by: user?.id })
          .select()
          .single()
        if (error) throw error
        if (items && items.length > 0) {
          await supabase.from('appointment_items').insert(items.map((it) => ({ appointment_id: data.id, item_id: it.item_id, qty: it.qty })))
        } else if (service_item_id) {
          await supabase.from('appointment_items').insert({ appointment_id: data.id, item_id: service_item_id, qty: 1 })
        }
        return data as Appointment
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useSetAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useSetAppointmentBay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, bay_id }: { id: string; bay_id: string | null }) => {
      const { error } = await supabase.from('appointments').update({ bay_id }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
