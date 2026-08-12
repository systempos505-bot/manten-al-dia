import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PERMISSION_ORDER } from './useRolePermissions'
import type { CustomRole, CustomRolePermission, PermissionKey } from '../types/database'

export function useCustomRoles() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['custom_roles', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CustomRole[]
    },
  })
}

export function useCreateCustomRole() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('custom_roles')
        .insert({ business_id: businessId, name })
        .select()
        .single()
      if (error) throw error
      const role = data as CustomRole
      const rows = PERMISSION_ORDER.map((key) => ({
        business_id: businessId,
        custom_role_id: role.id,
        permission_key: key,
        allowed: false,
      }))
      const { error: permError } = await supabase.from('custom_role_permissions').insert(rows)
      if (permError) throw permError
      return role
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom_roles'] })
      qc.invalidateQueries({ queryKey: ['custom_role_permissions'] })
    },
  })
}

export function useRenameCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('custom_roles').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_roles'] }),
  })
}

export function useDeleteCustomRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_roles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom_roles'] })
      qc.invalidateQueries({ queryKey: ['business_members'] })
    },
  })
}

export function useCustomRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ['custom_role_permissions', roleId],
    enabled: Boolean(roleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_role_permissions')
        .select('*')
        .eq('custom_role_id', roleId!)
      if (error) throw error
      return data as CustomRolePermission[]
    },
  })
}

export function useSetCustomRolePermission() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      customRoleId,
      permission_key,
      allowed,
    }: {
      customRoleId: string
      permission_key: PermissionKey
      allowed: boolean
    }) => {
      const { error } = await supabase
        .from('custom_role_permissions')
        .upsert(
          { business_id: businessId, custom_role_id: customRoleId, permission_key, allowed },
          { onConflict: 'custom_role_id,permission_key' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom_role_permissions'] }),
  })
}
