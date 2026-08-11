import { useState } from 'react'
import { Plus, Car, Phone, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import {
  useClients,
  useClientVehicles,
  useSaveClient,
  useDeleteClient,
  useSaveVehicle,
  useDeleteVehicle,
} from '../hooks/useClients'
import type { Client, Vehicle, VehicleType } from '../types/database'

const emptyClient = { full_name: '', phone: '', email: '', notes: '' }
const emptyVehicle = { vehicle_type: 'auto' as VehicleType, brand: '', model: '', color: '', plate: '', notes: '' }

export function Clients() {
  const [search, setSearch] = useState('')
  const { data: clients, isLoading } = useClients(search)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [clientModal, setClientModal] = useState<{ open: boolean; editing: Client | null }>({ open: false, editing: null })
  const [clientForm, setClientForm] = useState(emptyClient)
  const saveClient = useSaveClient()
  const deleteClient = useDeleteClient()
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<Client | null>(null)

  const selected = clients?.find((c) => c.id === selectedId) ?? null
  const { data: vehicles, isLoading: loadingVehicles } = useClientVehicles(selectedId)

  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; editing: Vehicle | null }>({ open: false, editing: null })
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const saveVehicle = useSaveVehicle()
  const deleteVehicle = useDeleteVehicle()
  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState<Vehicle | null>(null)

  function openNewClient() {
    setClientForm(emptyClient)
    setClientModal({ open: true, editing: null })
  }

  function openEditClient(c: Client) {
    setClientForm({ full_name: c.full_name, phone: c.phone ?? '', email: c.email ?? '', notes: c.notes ?? '' })
    setClientModal({ open: true, editing: c })
  }

  async function submitClient() {
    await saveClient.mutateAsync({ id: clientModal.editing?.id, ...clientForm })
    setClientModal({ open: false, editing: null })
  }

  function openNewVehicle() {
    setVehicleForm(emptyVehicle)
    setVehicleModal({ open: true, editing: null })
  }

  function openEditVehicle(v: Vehicle) {
    setVehicleForm({
      vehicle_type: v.vehicle_type,
      brand: v.brand ?? '',
      model: v.model ?? '',
      color: v.color ?? '',
      plate: v.plate ?? '',
      notes: v.notes ?? '',
    })
    setVehicleModal({ open: true, editing: v })
  }

  async function submitVehicle() {
    if (!selectedId) return
    await saveVehicle.mutateAsync({ id: vehicleModal.editing?.id, client_id: selectedId, ...vehicleForm })
    setVehicleModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base de clientes y sus vehículos"
        action={
          <Button onClick={openNewClient}>
            <Plus size={16} /> Nuevo cliente
          </Button>
        }
      />

      <div className="mb-4">
        <Input placeholder="Buscar cliente por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1.4fr]">
        <Card className="p-0">
          {isLoading ? (
            <Loading />
          ) : !clients || clients.length === 0 ? (
            <EmptyState title="Aún no tienes clientes" description="Agrega tu primer cliente para comenzar." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {clients.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition ${
                      selectedId === c.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.full_name}</p>
                      {c.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone size={12} /> {c.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditClient(c)
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={14} />
                      </span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteClient(c)
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {!selected ? (
            <EmptyState title="Selecciona un cliente" description="Elige un cliente de la lista para ver sus vehículos." />
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selected.full_name}</h3>
                  <p className="text-sm text-slate-500">{selected.email || 'Sin correo registrado'}</p>
                </div>
                <Button size="sm" onClick={openNewVehicle}>
                  <Plus size={14} /> Vehículo
                </Button>
              </div>

              {loadingVehicles ? (
                <Loading />
              ) : !vehicles || vehicles.length === 0 ? (
                <EmptyState title="Sin vehículos registrados" />
              ) : (
                <div className="grid gap-3">
                  {vehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Car size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {v.brand || 'Marca'} {v.model || ''} {v.color ? `· ${v.color}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {v.plate ? `Placa ${v.plate}` : 'Sin placa'} · {v.vehicle_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditVehicle(v)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteVehicle(v)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal open={clientModal.open} title={clientModal.editing ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setClientModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Nombre completo">
            <Input value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} required />
          </Field>
          <Field label="Teléfono">
            <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
          </Field>
          <Field label="Notas">
            <Textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} />
          </Field>
          <Button disabled={!clientForm.full_name || saveClient.isPending} onClick={submitClient}>
            {saveClient.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal open={vehicleModal.open} title={vehicleModal.editing ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={() => setVehicleModal({ open: false, editing: null })}>
        <div className="grid gap-4">
          <Field label="Tipo">
            <Select value={vehicleForm.vehicle_type} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value as VehicleType })}>
              <option value="auto">Auto</option>
              <option value="camioneta">Camioneta</option>
              <option value="moto">Moto</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca">
              <Input value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} />
            </Field>
            <Field label="Modelo">
              <Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color">
              <Input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} />
            </Field>
            <Field label="Placa">
              <Input value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} />
          </Field>
          <Button disabled={saveVehicle.isPending} onClick={submitVehicle}>
            {saveVehicle.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDeleteClient)}
        title="Eliminar cliente"
        description={`Se eliminará a "${confirmDeleteClient?.full_name}" junto con sus vehículos. Esta acción no se puede deshacer.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDeleteClient(null)}
        onConfirm={async () => {
          if (confirmDeleteClient) {
            await deleteClient.mutateAsync(confirmDeleteClient.id)
            if (selectedId === confirmDeleteClient.id) setSelectedId(null)
          }
          setConfirmDeleteClient(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteVehicle)}
        title="Eliminar vehículo"
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDeleteVehicle(null)}
        onConfirm={async () => {
          if (confirmDeleteVehicle && selectedId) {
            await deleteVehicle.mutateAsync({ id: confirmDeleteVehicle.id, client_id: selectedId })
          }
          setConfirmDeleteVehicle(null)
        }}
      />
    </div>
  )
}
