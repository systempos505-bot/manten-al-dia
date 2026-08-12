import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BusinessInvite, BusinessMember, MemberRole } from '../types/database'

function randomInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

export function useBusinessMembers() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['business_members', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_members')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as BusinessMember[]
    },
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role, customRoleId }: { id: string; role: MemberRole; customRoleId?: string | null }) => {
      const { error } = await supabase
        .from('business_members')
        .update({ role, custom_role_id: role === 'admin' ? null : customRoleId ?? null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_members'] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_members'] }),
  })
}

export function useInvites() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['business_invites', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_invites')
        .select('*')
        .eq('business_id', businessId!)
        .is('used_by', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as BusinessInvite[]
    },
  })
}

export function useCreateInvite() {
  const { businessId, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (role: MemberRole) => {
      const { data, error } = await supabase
        .from('business_invites')
        .insert({ business_id: businessId, role, code: randomInviteCode(), created_by: user?.id })
        .select()
        .single()
      if (error) throw error
      return data as BusinessInvite
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_invites'] }),
  })
}

export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_invites').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_invites'] }),
  })
}

export function useUpdateBusiness() {
  const { businessId, refreshBusiness } = useAuth()
  return useMutation({
    mutationFn: async (input: {
      name: string
      currency: string
      secondary_currency?: string | null
      exchange_rate?: number
      date_format?: string
      time_format?: string
      logo_url?: string | null
      currency_decimals?: number
      quantity_decimals?: number
    }) => {
      const { error } = await supabase.from('businesses').update(input).eq('id', businessId!)
      if (error) throw error
    },
    onSuccess: () => refreshBusiness(),
  })
}
