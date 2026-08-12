import { useState } from 'react'
import { Pencil, Trash2, Phone } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { useSuppliers, useSaveSupplier, useDeleteSupplier } from '../../hooks/useSuppliers'
import type { Supplier } from '../../types/database'

export function SuppliersList() {
  const { data: suppliers, isLoading } = useSuppliers()
  const saveSupplier = useSaveSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [modal, setModal] = useState<{ open: boolean; editing: Supplier | null }>({ open: false, editing: null })
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null)

  function openEdit(s: Supplier) {
    setForm({ name: s.name, phone: s.phone ?? '', email: s.email ?? '', notes: s.notes ?? '' })
    setModal({ open: true, editing: s })
  }

  async function submit() {
    if (!modal.editing) return
    await saveSupplier.mutateAsync({ id: modal.editing.id, ...form })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader title="Lista de Proveedores" description="Proveedores registrados" />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !suppliers || suppliers.length === 0 ? (
          <EmptyState title="Sin proveedores registrados" description="Agrega tu primer proveedor desde 'Crear Proveedor'." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  {s.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone size={12} /> {s.phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(s)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal.open} title="Editar proveedor" onClose={() => setModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Notas">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button disabled={!form.name || saveSupplier.isPending} onClick={submit}>
            {saveSupplier.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar proveedor"
        description={`Se eliminará a "${confirmDelete?.name}".`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteSupplier.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
