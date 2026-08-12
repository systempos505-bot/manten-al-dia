import { useEffect, useState } from 'react'
import { Copy, Trash2, UserPlus, Check, X } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Input, Select } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
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
import { formatDate } from '../lib/format'
import type { MemberRole } from '../types/database'

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

export function Settings() {
  const { businessName, currency, user } = useAuth()
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

  const { data: members, isLoading: loadingMembers } = useBusinessMembers()
  const updateRole = useUpdateMemberRole()

  const { data: invites, isLoading: loadingInvites } = useInvites()
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()
  const [inviteRole, setInviteRole] = useState<MemberRole>('staff')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // el navegador puede bloquear el portapapeles; el código sigue visible en pantalla
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  return (
    <div>
      <PageHeader title="Configuración" description="Datos del negocio, moneda y usuarios con acceso" />

      <div className="grid gap-6">
        <Card className="p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-800">Roles y permisos</p>
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

        <Card>
          <p className="mb-4 font-bold text-slate-800">Negocio</p>
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

        <Card className="p-0">
          <p className="border-b border-slate-100 px-5 py-4 font-bold text-slate-800">Usuarios con acceso</p>
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

        <Card>
          <p className="mb-1 font-bold text-slate-800">Invitar a alguien más</p>
          <p className="mb-4 text-sm text-slate-500">
            Genera un código y compártelo con esa persona. Al crear su cuenta, elige "Unirme con código" y lo
            pega ahí — se une a tu mismo negocio con el rol que elijas aquí.
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
      </div>
    </div>
  )
}
