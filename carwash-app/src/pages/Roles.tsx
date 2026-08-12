import { useState } from 'react'
import { ChevronRight, Check, X, ShieldCheck, UserRound, Plus, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Field, Input } from '../components/ui/Input'
import {
  useStaffPermissions,
  useSetStaffPermission,
  PERMISSION_LABELS,
  PERMISSION_ORDER,
} from '../hooks/useRolePermissions'
import {
  useCustomRoles,
  useCreateCustomRole,
  useRenameCustomRole,
  useDeleteCustomRole,
  useCustomRolePermissions,
  useSetCustomRolePermission,
} from '../hooks/useCustomRoles'
import type { CustomRole, PermissionKey } from '../types/database'

type OpenTarget = { kind: 'admin' } | { kind: 'staff' } | { kind: 'custom'; role: CustomRole }

export function Roles() {
  const [open, setOpen] = useState<OpenTarget | null>(null)
  const [newRoleModal, setNewRoleModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<CustomRole | null>(null)

  const { data: staffPerms, isLoading: loadingStaff } = useStaffPermissions()
  const setStaffPermission = useSetStaffPermission()

  const { data: customRoles, isLoading: loadingCustomRoles } = useCustomRoles()
  const createCustomRole = useCreateCustomRole()
  const renameCustomRole = useRenameCustomRole()
  const deleteCustomRole = useDeleteCustomRole()

  const openCustomRoleId = open?.kind === 'custom' ? open.role.id : null
  const { data: customPerms, isLoading: loadingCustomPerms } = useCustomRolePermissions(openCustomRoleId)
  const setCustomPermission = useSetCustomRolePermission()

  function isStaffAllowed(key: PermissionKey) {
    return staffPerms?.find((p) => p.permission_key === key)?.allowed ?? false
  }

  function isCustomAllowed(key: PermissionKey) {
    return customPerms?.find((p) => p.permission_key === key)?.allowed ?? false
  }

  async function submitNewRole() {
    await createCustomRole.mutateAsync(newRoleName)
    setNewRoleName('')
    setNewRoleModal(false)
  }

  function startRename() {
    if (open?.kind === 'custom') {
      setRenameValue(open.role.name)
      setRenaming(true)
    }
  }

  async function submitRename() {
    if (open?.kind === 'custom' && renameValue.trim()) {
      await renameCustomRole.mutateAsync({ id: open.role.id, name: renameValue.trim() })
      setOpen({ kind: 'custom', role: { ...open.role, name: renameValue.trim() } })
    }
    setRenaming(false)
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Selecciona un rol para ver y editar sus permisos, o crea un rol nuevo"
        action={
          <Button onClick={() => setNewRoleModal(true)}>
            <Plus size={16} /> Crear rol
          </Button>
        }
      />

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          <li>
            <button
              onClick={() => setOpen({ kind: 'admin' })}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Administrador</p>
                  <p className="text-xs text-slate-500">Acceso total al negocio. No se puede restringir.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </li>

          <li>
            <button
              onClick={() => setOpen({ kind: 'staff' })}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Operador</p>
                  <p className="text-xs text-slate-500">Rol por defecto para el resto del equipo.</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </li>

          {loadingCustomRoles ? (
            <li className="px-5 py-4">
              <Loading />
            </li>
          ) : (
            customRoles?.map((role) => (
              <li key={role.id}>
                <button
                  onClick={() => setOpen({ kind: 'custom', role })}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <UserRound size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{role.name}</p>
                      <p className="text-xs text-slate-500">Rol personalizado</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      {/* Modal: crear rol nuevo */}
      <Modal open={newRoleModal} title="Crear rol nuevo" onClose={() => setNewRoleModal(false)}>
        <div className="grid gap-4">
          <Field label="Nombre del rol">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ej. Cajero, Supervisor..."
              required
            />
          </Field>
          <Button disabled={!newRoleName.trim() || createCustomRole.isPending} onClick={submitNewRole}>
            {createCustomRole.isPending ? 'Creando...' : 'Crear rol'}
          </Button>
        </div>
      </Modal>

      {/* Modal: ver/editar permisos de un rol */}
      <Modal
        open={open !== null}
        title={
          open?.kind === 'admin'
            ? 'Permisos: Administrador'
            : open?.kind === 'staff'
              ? 'Permisos: Operador'
              : open?.kind === 'custom'
                ? `Permisos: ${open.role.name}`
                : ''
        }
        onClose={() => {
          setOpen(null)
          setRenaming(false)
        }}
      >
        {open?.kind === 'admin' && (
          <p className="text-sm text-slate-500">
            El Administrador siempre tiene acceso completo a todas las funciones, para asegurar que siempre puedas
            gestionar tu negocio. Este rol no se puede restringir ni eliminar.
          </p>
        )}

        {open?.kind === 'staff' && (
          <div>
            {loadingStaff ? (
              <Loading />
            ) : (
              <ul className="grid gap-1">
                {PERMISSION_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{PERMISSION_LABELS[key]}</span>
                    <button
                      onClick={() => setStaffPermission.mutate({ permission_key: key, allowed: !isStaffAllowed(key) })}
                      disabled={setStaffPermission.isPending}
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

        {open?.kind === 'custom' && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-2">
              {renaming ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                  <Button size="sm" onClick={submitRename} disabled={renameCustomRole.isPending}>
                    Guardar
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={startRename}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    <Pencil size={13} /> Cambiar nombre
                  </button>
                  <button
                    onClick={() => setConfirmDelete(open.role)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={13} /> Eliminar rol
                  </button>
                </>
              )}
            </div>

            {loadingCustomPerms ? (
              <Loading />
            ) : (
              <ul className="grid gap-1">
                {PERMISSION_ORDER.map((key) => (
                  <li key={key} className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{PERMISSION_LABELS[key]}</span>
                    <button
                      onClick={() =>
                        setCustomPermission.mutate({
                          customRoleId: open.role.id,
                          permission_key: key,
                          allowed: !isCustomAllowed(key),
                        })
                      }
                      disabled={setCustomPermission.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100"
                    >
                      {isCustomAllowed(key) ? (
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

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar rol"
        description={`Se eliminará el rol "${confirmDelete?.name}". Los usuarios que lo tengan asignado pasarán a ser Operador. Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteCustomRole.mutateAsync(confirmDelete.id)
            setOpen(null)
          }
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
