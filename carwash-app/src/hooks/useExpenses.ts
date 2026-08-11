import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { CashMovement, Expense } from '../types/database'

export function useExpenses() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['expenses', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId!)
        .order('expense_date', { ascending: false })
        .limit(200)
      if (error) throw error
      return data as Expense[]
    },
  })
}

export function useCreateExpense() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Expense, 'id' | 'business_id' | 'created_by' | 'created_at'>) => {
      const { error } = await supabase.from('expenses').insert({ ...input, business_id: businessId, created_by: user?.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['cash_movements'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCashMovements(range?: { from: string; to: string }) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['cash_movements', businessId, range?.from, range?.to],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('cash_movements')
        .select('*')
        .eq('business_id', businessId!)
        .order('movement_date', { ascending: false })
        .limit(300)
      if (range) query = query.gte('movement_date', range.from).lte('movement_date', range.to)
      const { data, error } = await query
      if (error) throw error
      return data as CashMovement[]
    },
  })
}

export function useCreateCashMovement() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { type: 'apertura' | 'ajuste' | 'cierre'; amount: number; description: string }) => {
      const { error } = await supabase.from('cash_movements').insert({
        ...input,
        business_id: businessId,
        created_by: user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash_movements'] }),
  })
}
