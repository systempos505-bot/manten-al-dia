import { Check, X } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { useStaffPermissions, useSetStaffPermission, PERMISSION_LABELS, PERMISSION_ORDER } from '../hooks/useRolePermissions'
import type { PermissionKey } from '../types/database'

export function Roles() {
  const { data: staffPerms, isLoading } = useStaffPermissions()
  const setPermission = useSetStaffPermission()

  function isStaffAllowed(key: PermissionKey) {
    return staffPerms?.find((p) => p.permission_key === key)?.allowed ?? false
  }

  function toggleStaff(key: PermissionKey) {
    setPermission.mutate({ permission_key: key, allowed: !isStaffAllowed(key) })
  }

  return (
    <div>
      <PageHeader title="Roles" description="Administrador siempre tiene acceso total. Edita qué puede usar el Operador." />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Puede usar...</th>
                <th className="px-5 py-3 text-center">Administrador</th>
                <th className="px-5 py-3 text-center">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-6">
                    <Loading />
                  </td>
                </tr>
              ) : (
                PERMISSION_ORDER.map((key) => (
                  <tr key={key}>
                    <td className="px-5 py-2.5 text-slate-700">{PERMISSION_LABELS[key]}</td>
                    <td className="px-5 py-2.5 text-center">
                      <Check size={16} className="mx-auto text-emerald-600" />
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <button
                        onClick={() => toggleStaff(key)}
                        disabled={setPermission.isPending}
                        className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100"
                        title="Click para cambiar"
                      >
                        {isStaffAllowed(key) ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <X size={16} className="text-slate-300" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
