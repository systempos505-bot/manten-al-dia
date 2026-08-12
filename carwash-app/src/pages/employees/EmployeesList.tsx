import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Field, Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { Button } from '../../components/ui/Button'
import { useEmployees, useSaveEmployee, useDeleteEmployee } from '../../hooks/useEmployees'
import type { Employee } from '../../types/database'

export function EmployeesList() {
  const { data: employees, isLoading } = useEmployees()
  const saveEmployee = useSaveEmployee()
  const deleteEmployee = useDeleteEmployee()

  const [modal, setModal] = useState<{ open: boolean; editing: Employee | null }>({ open: false, editing: null })
  const [form, setForm] = useState({ full_name: '', phone: '', role: '', commission_pct: '0', active: true })
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null)

  function openEdit(e: Employee) {
    setForm({ full_name: e.full_name, phone: e.phone ?? '', role: e.role, commission_pct: String(e.commission_pct), active: e.active })
    setModal({ open: true, editing: e })
  }

  async function submit() {
    if (!modal.editing) return
    await saveEmployee.mutateAsync({
      id: modal.editing.id,
      full_name: form.full_name,
      phone: form.phone || null,
      role: form.role,
      commission_pct: Number(form.commission_pct) || 0,
      active: form.active,
    })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader title="Lista de Empleados" description="Personal y comisiones" />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !employees || employees.length === 0 ? (
          <EmptyState title="Sin empleados registrados" description="Agrega a tu equipo para asignarles ventas y comisiones." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Comisión</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{e.full_name}</p>
                      {e.phone && <p className="text-xs text-slate-500">{e.phone}</p>}
                    </td>
                    <td className="px-5 py-3 capitalize">{e.role}</td>
                    <td className="px-5 py-3">{e.commission_pct}%</td>
                    <td className="px-5 py-3">{e.active ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(e)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={14} />
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

      <Modal open={modal.open} title="Editar empleado" onClose={() => setModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre completo">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rol">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="lavador, cajero, gerente" />
            </Field>
            <Field label="Comisión (%)">
              <Input type="number" step="0.1" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            Activo
          </label>
          <Button disabled={!form.full_name || saveEmployee.isPending} onClick={submit}>
            {saveEmployee.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar empleado"
        description={`Se eliminará a "${confirmDelete?.full_name}".`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteEmployee.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
