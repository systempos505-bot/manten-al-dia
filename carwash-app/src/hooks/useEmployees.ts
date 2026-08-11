import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Employee, Shift } from '../types/database'

export function useEmployees(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['employees', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .eq('business_id', businessId!)
        .order('full_name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as Employee[]
    },
  })
}

export function useSaveEmployee() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Employee> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('employees').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('employees').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useShifts(employeeId?: string) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['shifts', businessId, employeeId ?? 'all'],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('shifts')
        .select('*, employee:employees(id, full_name)')
        .eq('business_id', businessId!)
        .order('clock_in', { ascending: false })
        .limit(200)
      if (employeeId) query = query.eq('employee_id', employeeId)
      const { data, error } = await query
      if (error) throw error
      return data as (Shift & { employee: { id: string; full_name: string } | null })[]
    },
  })
}

export function useClockIn() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (employee_id: string) => {
      const { error } = await supabase.from('shifts').insert({ business_id: businessId, employee_id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.from('shifts').update({ clock_out: new Date().toISOString() }).eq('id', shiftId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  })
}
