import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { PermissionKey, RolePermission } from '../types/database'

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  pos: 'Punto de venta',
  citas: 'Citas',
  clientes: 'Clientes',
  catalogo_ver: 'Ver catálogo (productos y servicios)',
  catalogo_editar: 'Editar precios y catálogo',
  compras: 'Compras',
  empleados: 'Empleados',
  caja: 'Gastos y caja',
  reportes: 'Reportes',
  configuracion: 'Configuración y usuarios',
}

export const PERMISSION_ORDER: PermissionKey[] = [
  'pos',
  'citas',
  'clientes',
  'catalogo_ver',
  'catalogo_editar',
  'compras',
  'empleados',
  'caja',
  'reportes',
  'configuracion',
]

export function useStaffPermissions() {
  const { businessId } = useAuth()
  return useQuery({
    queryKey: ['role_permissions', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('business_id', businessId!)
        .eq('role', 'staff')
      if (error) throw error
      return data as RolePermission[]
    },
  })
}

export function useSetStaffPermission() {
  const { businessId } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ permission_key, allowed }: { permission_key: PermissionKey; allowed: boolean }) => {
      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          { business_id: businessId, role: 'staff', permission_key, allowed },
          { onConflict: 'business_id,role,permission_key' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role_permissions'] })
    },
  })
}
