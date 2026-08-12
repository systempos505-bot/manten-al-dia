import { useState } from 'react'
import { Plus, Pencil, Trash2, Warehouse } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useBays, useSaveBay, useDeleteBay } from '../hooks/useBays'
import type { Bay } from '../types/database'

export function BaysConfig() {
  const { data: bays, isLoading } = useBays()
  const saveBay = useSaveBay()
  const deleteBay = useDeleteBay()

  const [modal, setModal] = useState<{ open: boolean; editing: Bay | null }>({ open: false, editing: null })
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<Bay | null>(null)

  function openNew() {
    setName('')
    setActive(true)
    setModal({ open: true, editing: null })
  }

  function openEdit(b: Bay) {
    setName(b.name)
    setActive(b.active)
    setModal({ open: true, editing: b })
  }

  async function submit() {
    await saveBay.mutateAsync({ id: modal.editing?.id, name, active, sort_order: modal.editing?.sort_order ?? 0 })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader
        title="Bahías"
        description="Estaciones donde lavas los vehículos"
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> Nueva bahía
          </Button>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !bays || bays.length === 0 ? (
          <EmptyState
            title="Sin bahías registradas"
            description="Agrega las estaciones donde lavas los vehículos, por ejemplo Bahía 1, Bahía 2..."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {bays.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Warehouse size={18} />
                  </div>
                  <p className="font-semibold text-slate-900">{b.name}</p>
                  {b.active ? <Badge tone="green">Activa</Badge> : <Badge tone="gray">Inactiva</Badge>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(b)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal.open} title={modal.editing ? 'Editar bahía' : 'Nueva bahía'} onClose={() => setModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bahía 1" required />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Activa
          </label>
          <Button disabled={!name || saveBay.isPending} onClick={submit}>
            {saveBay.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar bahía"
        description={`Se eliminará "${confirmDelete?.name}". Las citas que la tenían asignada quedarán sin bahía.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteBay.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
