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
import { useProductCategories, useSaveProductCategory, useDeleteProductCategory } from '../../hooks/useProductCategories'
import type { ProductCategory } from '../../types/database'

export function Categories() {
  const { data: categories, isLoading } = useProductCategories()
  const saveCategory = useSaveProductCategory()
  const deleteCategory = useDeleteProductCategory()
  const [modal, setModal] = useState<{ open: boolean; editing: ProductCategory | null }>({ open: false, editing: null })
  const [form, setForm] = useState({ name: '' })
  const [confirmDelete, setConfirmDelete] = useState<ProductCategory | null>(null)

  function openNew() {
    setForm({ name: '' })
    setModal({ open: true, editing: null })
  }

  function openEdit(c: ProductCategory) {
    setForm({ name: c.name })
    setModal({ open: true, editing: c })
  }

  async function submit() {
    await saveCategory.mutateAsync({ id: modal.editing?.id, name: form.name, active: true })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Gestiona las categorías para clasificar tus productos y servicios"
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> Agregar
          </Button>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !categories || categories.length === 0 ? (
          <EmptyState title="Sin categorías registradas" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <p className="font-semibold text-slate-800">{c.name}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(c)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal.open} title={modal.editing ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Button disabled={!form.name || saveCategory.isPending} onClick={submit}>
            {saveCategory.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar categoría"
        description={`Se eliminará "${confirmDelete?.name}". Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteCategory.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
