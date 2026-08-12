import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ExpenseCategoryItem } from '../types/database'

export function useExpenseCategories(onlyActive = false) {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['expense_categories', businessId, onlyActive],
    enabled: Boolean(businessId),
    queryFn: async () => {
      let query = supabase
        .from('expense_categories')
        .select('*')
        .eq('business_id', businessId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (onlyActive) query = query.eq('active', true)
      const { data, error } = await query
      if (error) throw error
      return data as ExpenseCategoryItem[]
    },
  })
}

export function useSaveExpenseCategory() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ExpenseCategoryItem> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('expense_categories').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('expense_categories').insert({ ...rest, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense_categories'] }),
  })
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense_categories'] }),
  })
}
