import { useEffect, useState } from 'react'
import { Trash2, Plus, Pencil } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { CURRENCY_OPTIONS } from '../hooks/useCurrency'
import { useUpdateBusiness } from '../hooks/useTeam'
import { useVehicleTypes, useSaveVehicleType, useDeleteVehicleType } from '../hooks/useVehicleTypes'
import type { VehicleTypeItem } from '../types/database'

export function Settings() {
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
      <PageHeader title="Configuración" description="Datos del negocio, moneda y tipos de vehículos" />

      <div className="grid gap-6">
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
      </div>

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
