import { useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useProductUnits, useSaveProductUnit, useDeleteProductUnit } from '../../hooks/useProductUnits'
import type { ProductUnit } from '../../types/database'

export function Units() {
  const { data: units, isLoading } = useProductUnits()
  const saveUnit = useSaveProductUnit()
  const deleteUnit = useDeleteProductUnit()
  const [modal, setModal] = useState<{ open: boolean; editing: ProductUnit | null }>({ open: false, editing: null })
  const [form, setForm] = useState({ name: '' })
  const [confirmDelete, setConfirmDelete] = useState<ProductUnit | null>(null)

  function openNew() {
    setForm({ name: '' })
    setModal({ open: true, editing: null })
  }

  function openEdit(u: ProductUnit) {
    setForm({ name: u.name })
    setModal({ open: true, editing: u })
  }

  async function submit() {
    await saveUnit.mutateAsync({ id: modal.editing?.id, name: form.name, active: true })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Gestiona las unidades de medida para tus productos"
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> Agregar
          </Button>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !units || units.length === 0 ? (
          <EmptyState title="Sin unidades registradas" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {units.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3.5">
                <p className="font-semibold text-slate-800">{u.name}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(u)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal.open} title={modal.editing ? 'Editar unidad' : 'Nueva unidad'} onClose={() => setModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pieza, Kilogramo, Litro..." required />
          </Field>
          <Button disabled={!form.name || saveUnit.isPending} onClick={submit}>
            {saveUnit.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar unidad"
        description={`Se eliminará "${confirmDelete?.name}". Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteUnit.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
