import { useState } from 'react'
import { ChevronRight, Check, X, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { Modal } from '../components/ui/Modal'
import {
  useStaffPermissions,
  useSetStaffPermission,
  PERMISSION_LABELS,
  PERMISSION_ORDER,
} from '../hooks/useRolePermissions'
import type { PermissionKey } from '../types/database'

type RoleId = 'admin' | 'staff'

const ROLE_INFO: Record<RoleId, { title: string; description: string; icon: typeof ShieldCheck; editable: boolean }> = {
  admin: {
    title: 'Administrador',
    description: 'Acceso total al negocio. No se puede restringir.',
    icon: ShieldCheck,
    editable: false,
  },
  staff: {
    title: 'Operador',
    description: 'Ventas, citas y clientes. Edita aquí lo que puede usar.',
    icon: UserRound,
    editable: true,
  },
}

export function Roles() {
  const [openRole, setOpenRole] = useState<RoleId | null>(null)
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
      <PageHeader title="Roles" description="Selecciona un rol para ver y editar sus permisos" />

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {(Object.keys(ROLE_INFO) as RoleId[]).map((roleId) => {
            const info = ROLE_INFO[roleId]
            const Icon = info.icon
            return (
              <li key={roleId}>
                <button
                  onClick={() => setOpenRole(roleId)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{info.title}</p>
                      <p className="text-xs text-slate-500">{info.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Modal
        open={openRole !== null}
        title={openRole ? `Permisos: ${ROLE_INFO[openRole].title}` : ''}
        onClose={() => setOpenRole(null)}
      >
        {openRole === 'admin' && (
          <p className="text-sm text-slate-500">
            El Administrador siempre tiene acceso completo a todas las funciones, para asegurar que siempre puedas
            gestionar tu negocio. Este rol no se puede restringir.
          </p>
        )}

        {openRole === 'staff' && (
          <div>
            {isLoading ? (
              <Loading />
            ) : (
              <ul className="grid gap-1">
                {PERMISSION_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{PERMISSION_LABELS[key]}</span>
                    <button
                      onClick={() => toggleStaff(key)}
                      disabled={setPermission.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100"
                    >
                      {isStaffAllowed(key) ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <X size={16} className="text-slate-300" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
