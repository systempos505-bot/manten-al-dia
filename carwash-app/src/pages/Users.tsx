import { useState } from 'react'
import { Copy, Trash2, UserPlus, Pencil, Eye } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  useBusinessMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useInvites,
  useCreateInvite,
  useRevokeInvite,
} from '../hooks/useTeam'
import { formatDate } from '../lib/format'
import type { BusinessMember, MemberRole } from '../types/database'

const roleLabel: Record<MemberRole, string> = {
  admin: 'Administrador',
  staff: 'Operador (ventas, citas, clientes)',
}

export function Users() {
  const { user } = useAuth()
  const { data: members, isLoading: loadingMembers } = useBusinessMembers()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const { data: invites, isLoading: loadingInvites } = useInvites()
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()
  const [inviteRole, setInviteRole] = useState<MemberRole>('staff')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState<BusinessMember | null>(null)
  const [editRole, setEditRole] = useState<MemberRole>('staff')
  const [viewMember, setViewMember] = useState<BusinessMember | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<BusinessMember | null>(null)

  const filteredMembers = (members ?? []).filter((m) =>
    (m.email || '').toLowerCase().includes(search.toLowerCase()),
  )

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // navegador puede bloquear portapapeles
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  function openEdit(m: BusinessMember) {
    setEditRole(m.role)
    setEditModal(m)
  }

  async function saveEdit() {
    if (!editModal) return
    await updateRole.mutateAsync({ id: editModal.id, role: editRole })
    setEditModal(null)
  }

  return (
    <div>
      <PageHeader title="Usuarios" description="Administrar usuarios con acceso a tu negocio" />

      <div className="grid gap-6">
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

        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-800">Todos los Usuarios</p>
            <div className="w-full max-w-xs">
              <Input placeholder="Buscar por correo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {loadingMembers ? (
            <Loading />
          ) : filteredMembers.length === 0 ? (
            <EmptyState title="Sin usuarios" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-5 py-3">Desde</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {m.email || 'Correo no disponible'}
                        {m.user_id === user?.id && (
                          <span className="ml-2">
                            <Badge tone="blue">Tú</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={m.role === 'admin' ? 'blue' : 'gray'}>{roleLabel[m.role]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(m.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            onClick={() => setViewMember(m)}
                            className="flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50"
                          >
                            <Eye size={13} /> Ver
                          </button>
                          <button
                            onClick={() => setConfirmRemove(m)}
                            disabled={m.user_id === user?.id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={13} /> Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={Boolean(editModal)} title="Editar usuario" onClose={() => setEditModal(null)}>
        <div className="grid gap-4">
          <Field label="Correo">
            <Input value={editModal?.email || ''} disabled />
          </Field>
          <Field label="Rol">
            <Select value={editRole} onChange={(e) => setEditRole(e.target.value as MemberRole)}>
              <option value="admin">Administrador</option>
              <option value="staff">Operador</option>
            </Select>
          </Field>
          <Button onClick={saveEdit} disabled={updateRole.isPending}>
            {updateRole.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(viewMember)} title="Detalle del usuario" onClose={() => setViewMember(null)}>
        {viewMember && (
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Correo</p>
              <p className="font-semibold text-slate-800">{viewMember.email || 'No disponible'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Rol</p>
              <p className="font-semibold text-slate-800">{roleLabel[viewMember.role]}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Usuario desde</p>
              <p className="font-semibold text-slate-800">{formatDate(viewMember.created_at)}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmRemove)}
        title="Quitar acceso"
        description={`"${confirmRemove?.email}" perderá el acceso a este negocio. Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Quitar acceso"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={async () => {
          if (confirmRemove) {
            await removeMember.mutateAsync(confirmRemove.id)
          }
          setConfirmRemove(null)
        }}
      />
    </div>
  )
}
