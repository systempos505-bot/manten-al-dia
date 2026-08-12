import { useState } from 'react'
import { Copy, Trash2, UserPlus } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Select } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import {
  useBusinessMembers,
  useUpdateMemberRole,
  useInvites,
  useCreateInvite,
  useRevokeInvite,
} from '../hooks/useTeam'
import { formatDate } from '../lib/format'
import type { MemberRole } from '../types/database'

const roleLabel: Record<MemberRole, string> = {
  admin: 'Administrador',
  staff: 'Operador (ventas, citas, clientes)',
}

export function Users() {
  const { user } = useAuth()
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
      // navegador puede bloquear portapapeles
    }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  return (
    <div>
      <PageHeader title="Usuarios" description="Invita personas a tu negocio y gestiona quién tiene acceso" />

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
      </div>
    </div>
  )
}
