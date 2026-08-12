import { useEffect, useState } from 'react'
import { Copy, Trash2, UserPlus, Check, X, Plus, Pencil } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Input, Select } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { CURRENCY_OPTIONS } from '../hooks/useCurrency'
import {
  useBusinessMembers,
  useUpdateMemberRole,
  useInvites,
  useCreateInvite,
  useRevokeInvite,
  useUpdateBusiness,
} from '../hooks/useTeam'
import { useVehicleTypes, useSaveVehicleType, useDeleteVehicleType } from '../hooks/useVehicleTypes'
import { formatDate } from '../lib/format'
import type { MemberRole, VehicleTypeItem } from '../types/database'

const roleLabel: Record<MemberRole, string> = {
  admin: 'Administrador',
  staff: 'Operador (ventas, citas, clientes)',
}

const PERMISSION_ROWS: { label: string; admin: boolean; staff: boolean }[] = [
  { label: 'Punto de venta', admin: true, staff: true },
  { label: 'Citas', admin: true, staff: true },
  { label: 'Clientes', admin: true, staff: true },
  { label: 'Ver catálogo (productos y servicios)', admin: true, staff: true },
  { label: 'Editar precios y catálogo', admin: true, staff: false },
  { label: 'Compras', admin: true, staff: false },
  { label: 'Empleados', admin: true, staff: false },
  { label: 'Gastos y caja', admin: true, staff: false },
  { label: 'Reportes', admin: true, staff: false },
  { label: 'Configuración (este panel)', admin: true, staff: false },
]

function PermCell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check size={16} className="mx-auto text-emerald-600" />
  ) : (
    <X size={16} className="mx-auto text-slate-300" />
  )
}

// ========== Módulo: Configuración de Empresa ==========
function CompanyConfigSection() {
  const { businessName, currency } = useAuth()
  const updateBusiness = useUpdateBusiness()
  const [name, setName] = useState(businessName || '')
  const [curr, setCurr] = useState(currency)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(businessName || '')
    setCurr(currency)
  }, [businessName, currency])

  async function saveBusiness() {
    await updateBusiness.mutateAsync({ name, currency: curr })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <p className="mb-4 font-bold text-slate-800">Configuración de Empresa</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del negocio">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Moneda">
          <Select value={curr} onChange={(e) => setCurr(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={saveBusiness} disabled={updateBusiness.isPending || !name}>
          {updateBusiness.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
      </div>
    </Card>
  )
}

// ========== Módulo: Roles y Permisos ==========
function RolesPermissionsSection() {
  return (
    <Card className="p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="font-bold text-slate-800">Roles y Permisos</p>
        <p className="mt-1 text-sm text-slate-500">
          Solo existen estos dos roles por ahora. Se asignan al invitar a alguien nuevo, o después desde
          "Usuarios con acceso" abajo.
        </p>
      </div>
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
            {PERMISSION_ROWS.map((row) => (
              <tr key={row.label}>
                <td className="px-5 py-2.5 text-slate-700">{row.label}</td>
                <td className="px-5 py-2.5 text-center">
                  <PermCell allowed={row.admin} />
                </td>
                <td className="px-5 py-2.5 text-center">
                  <PermCell allowed={row.staff} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ========== Módulo: Usuarios con Acceso ==========
function UsersAccessSection() {
  const { user } = useAuth()
  const { data: members, isLoading: loadingMembers } = useBusinessMembers()
  const updateRole = useUpdateMemberRole()

  return (
    <Card className="p-0">
      <p className="border-b border-slate-100 px-5 py-4 font-bold text-slate-800">Usuarios con Acceso</p>
      {loadingMembers ? (
        <Loading />
      ) : !members || members.length === 0 ? (
        <EmptyState title="Sin usuarios" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div>
                <p className="font-semibold text-slate-800">
                  {m.email || 'Correo no disponible'}
                  {m.user_id === user?.id && (
                    <span className="ml-2">
                      <Badge tone="blue">Tú</Badge>
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Desde {formatDate(m.created_at)}</p>
              </div>
              <Select
                value={m.role}
                onChange={(e) => updateRole.mutate({ id: m.id, role: e.target.value as MemberRole })}
                className="!w-auto"
              >
                <option value="admin">Administrador</option>
                <option value="staff">Operador</option>
              </Select>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// ========== Módulo: Invitaciones ==========
function InvitesSection() {
  const { data: invites, isLoading: loadingInvites } = useInvites()
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()
  const [inviteRole, setInviteRole] = useState<MemberRole>('staff')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // el navegador puede bloquear el portapapeles
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  return (
    <Card>
      <p className="mb-1 font-bold text-slate-800">Invitar a Alguien Más</p>
      <p className="mb-4 text-sm text-slate-500">
        Genera un código y compártelo. Al crear su cuenta, elige "Unirme con código" y lo pega ahí — se une a tu
        negocio con el rol que elijas.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Rol para la invitación">
          <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MemberRole)}>
            <option value="staff">Operador (ventas, citas, clientes)</option>
            <option value="admin">Administrador (acceso total)</option>
          </Select>
        </Field>
        <Button onClick={() => createInvite.mutate(inviteRole)} disabled={createInvite.isPending}>
          <UserPlus size={16} /> Generar código
        </Button>
      </div>

      <div className="mt-5">
        {loadingInvites ? (
          <Loading />
        ) : !invites || invites.length === 0 ? (
          <p className="text-sm text-slate-400">Sin invitaciones pendientes.</p>
        ) : (
          <ul className="grid gap-2">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-bold tracking-wider">
                    {inv.code}
                  </span>
                  <Badge tone={inv.role === 'admin' ? 'blue' : 'gray'}>{roleLabel[inv.role]}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyCode(inv.code)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Copiar código"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => revokeInvite.mutate(inv.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Cancelar invitación"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {copiedCode === inv.code && <span className="text-xs font-semibold text-emerald-600">¡Copiado!</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

// ========== Módulo: Tipos de Vehículos ==========
function VehicleTypesSection() {
  const { data: vehicleTypes, isLoading: loadingTypes } = useVehicleTypes()
  const saveVehicleType = useSaveVehicleType()
  const deleteVehicleType = useDeleteVehicleType()

  const [typeModal, setTypeModal] = useState<{ open: boolean; editing: VehicleTypeItem | null }>({ open: false, editing: null })
  const [typeForm, setTypeForm] = useState({ name: '' })
  const [confirmDelete, setConfirmDelete] = useState<VehicleTypeItem | null>(null)

  function openNewType() {
    setTypeForm({ name: '' })
    setTypeModal({ open: true, editing: null })
  }

  function openEditType(t: VehicleTypeItem) {
    setTypeForm({ name: t.name })
    setTypeModal({ open: true, editing: t })
  }

  async function submitType() {
    await saveVehicleType.mutateAsync({ id: typeModal.editing?.id, name: typeForm.name, active: true })
    setTypeModal({ open: false, editing: null })
  }

  return (
    <>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="font-bold text-slate-800">Tipos de Vehículos</p>
            <p className="mt-1 text-sm text-slate-500">Gestiona los tipos de vehículos para tu negocio</p>
          </div>
          <Button onClick={openNewType} size="sm">
            <Plus size={16} /> Agregar
          </Button>
        </div>
        {loadingTypes ? (
          <Loading />
        ) : !vehicleTypes || vehicleTypes.length === 0 ? (
          <EmptyState title="Sin tipos de vehículos" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {vehicleTypes.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-slate-800">{t.name}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditType(t)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={typeModal.open}
        title={typeModal.editing ? 'Editar tipo de vehículo' : 'Nuevo tipo de vehículo'}
        onClose={() => setTypeModal({ open: false, editing: null })}
      >
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
          </Field>
          <Button disabled={!typeForm.name || saveVehicleType.isPending} onClick={submitType}>
            {saveVehicleType.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar tipo de vehículo"
        description={`Se eliminará "${confirmDelete?.name}". Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteVehicleType.mutateAsync(confirmDelete.id)
          }
          setConfirmDelete(null)
        }}
      />
    </>
  )
}

export function Settings() {
  return (
    <div>
      <PageHeader title="Configuración" description="Gestiona tu empresa, roles, usuarios y configuraciones" />

      <div className="grid gap-6">
        <CompanyConfigSection />
        <RolesPermissionsSection />
        <UsersAccessSection />
        <InvitesSection />
        <VehicleTypesSection />
      </div>
    </div>
  )
}
