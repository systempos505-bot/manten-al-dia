import { useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useVehicleTypes, useSaveVehicleType, useDeleteVehicleType } from '../hooks/useVehicleTypes'
import type { VehicleTypeItem } from '../types/database'

export function VehicleTypes() {
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
    <div>
      <PageHeader
        title="Tipos de Vehículos"
        description="Gestiona los tipos de vehículos para tu negocio"
        action={
          <Button onClick={openNewType}>
            <Plus size={16} /> Agregar
          </Button>
        }
      />

      <Card className="p-0">
        {loadingTypes ? (
          <Loading />
        ) : !vehicleTypes || vehicleTypes.length === 0 ? (
          <EmptyState title="Sin tipos de vehículos" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {vehicleTypes.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <p className="font-semibold text-slate-800">{t.name}</p>
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
    </div>
  )
}
