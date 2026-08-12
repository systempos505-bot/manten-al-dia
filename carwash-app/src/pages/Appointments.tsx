import { useMemo, useState } from 'react'
import { Plus, Clock, Car, User, Trash2, Pencil, Warehouse } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import {
  useAppointments,
  useSaveAppointment,
  useSetAppointmentStatus,
  useSetAppointmentBay,
  useDeleteAppointment,
  type AppointmentWithRelations,
} from '../hooks/useAppointments'
import { useClients, useClientVehicles } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { useBays, useSaveBay, useDeleteBay } from '../hooks/useBays'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../lib/format'
import type { AppointmentStatus, Bay } from '../types/database'

const statusTone: Record<AppointmentStatus, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  pendiente: 'gray',
  confirmada: 'blue',
  en_espera: 'yellow',
  en_proceso: 'yellow',
  listo: 'blue',
  completada: 'green',
  cancelada: 'red',
}

const statusLabel: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_espera: 'En espera',
  en_proceso: 'Lavando',
  listo: 'Listo para entregar',
  completada: 'Entregado',
  cancelada: 'Cancelada',
}

function startOfDayISO(daysFromToday = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function Appointments() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<'agenda' | 'bahias'>('agenda')

  const range = useMemo(() => ({ from: startOfDayISO(-7), to: startOfDayISO(30) }), [])
  const { data: appointments, isLoading } = useAppointments(range)
  const { data: clients } = useClients()
  const { data: employees } = useEmployees(true)
  const { data: services } = useCatalogItems('service')
  const { data: bays } = useBays(true)
  const saveAppointment = useSaveAppointment()
  const setStatus = useSetAppointmentStatus()
  const setBay = useSetAppointmentBay()
  const deleteAppointment = useDeleteAppointment()

  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AppointmentWithRelations | null>(null)
  const [form, setForm] = useState({
    client_id: '',
    vehicle_id: '',
    employee_id: '',
    service_item_id: '',
    bay_id: '',
    scheduled_at: '',
    duration_min: '45',
    notes: '',
  })
  const { data: vehicles } = useClientVehicles(form.client_id || null)

  function openNew() {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    setForm({
      client_id: '',
      vehicle_id: '',
      employee_id: '',
      service_item_id: '',
      bay_id: '',
      scheduled_at: now.toISOString().slice(0, 16),
      duration_min: '45',
      notes: '',
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.scheduled_at) return
    await saveAppointment.mutateAsync({
      client_id: form.client_id || null,
      vehicle_id: form.vehicle_id || null,
      employee_id: form.employee_id || null,
      service_item_id: form.service_item_id || null,
      bay_id: form.bay_id || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_min: Number(form.duration_min) || 45,
      notes: form.notes || null,
    })
    setOpen(false)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>()
    for (const a of appointments ?? []) {
      const day = formatDateTime(a.scheduled_at).split(',')[0]
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(a)
    }
    return Array.from(map.entries())
  }, [appointments])

  return (
    <div>
      <PageHeader
        title="Citas"
        description="Agenda de servicios y seguimiento de lavados en curso"
        action={
          tab === 'agenda' && (
            <Button onClick={openNew}>
              <Plus size={16} /> Nueva cita
            </Button>
          )
        }
      />

      <div className="mb-5 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
        <button
          onClick={() => setTab('agenda')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'agenda' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Agenda
        </button>
        <button
          onClick={() => setTab('bahias')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'bahias' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Bahías
        </button>
      </div>

      {tab === 'agenda' ? (
        isLoading ? (
          <Loading />
        ) : !appointments || appointments.length === 0 ? (
          <EmptyState title="No hay citas en este rango" description="Agenda la próxima cita de un cliente." />
        ) : (
          <div className="grid gap-6">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{day}</p>
                <div className="grid gap-3">
                  {items.map((a) => (
                    <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{formatDateTime(a.scheduled_at)}</p>
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                            {a.client && (
                              <span className="flex items-center gap-1">
                                <User size={13} /> {a.client.full_name}
                              </span>
                            )}
                            {a.vehicle && (
                              <span className="flex items-center gap-1">
                                <Car size={13} /> {a.vehicle.brand} {a.vehicle.model} {a.vehicle.plate && `· ${a.vehicle.plate}`}
                              </span>
                            )}
                            {a.appointment_items?.[0]?.catalog_items?.name && <span>· {a.appointment_items[0].catalog_items.name}</span>}
                            {a.employee && <span>· {a.employee.full_name}</span>}
                            {a.bay && (
                              <span className="flex items-center gap-1">
                                <Warehouse size={13} /> {a.bay.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={a.bay_id || ''}
                          onChange={(e) => setBay.mutate({ id: a.id, bay_id: e.target.value || null })}
                          className="!w-auto"
                        >
                          <option value="">Sin bahía</option>
                          {bays?.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={a.status}
                          onChange={(e) => setStatus.mutate({ id: a.id, status: e.target.value as AppointmentStatus })}
                          className="!w-auto"
                        >
                          {Object.entries(statusLabel).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                        <button onClick={() => setConfirmDelete(a)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <BaysManager isAdmin={isAdmin} />
      )}

      <Modal open={open} title="Nueva cita" onClose={() => setOpen(false)}>
        <div className="grid gap-4">
          <Field label="Cliente">
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, vehicle_id: '' })}>
              <option value="">Sin cliente asignado</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Vehículo">
            <Select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} disabled={!form.client_id}>
              <option value="">Sin vehículo</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} {v.plate && `· ${v.plate}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Servicio">
            <Select value={form.service_item_id} onChange={(e) => setForm({ ...form, service_item_id: e.target.value })}>
              <option value="">Sin especificar</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Empleado asignado">
              <Select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Sin asignar</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bahía">
              <Select value={form.bay_id} onChange={(e) => setForm({ ...form, bay_id: e.target.value })}>
                <option value="">Sin asignar</option>
                {bays?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha y hora">
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </Field>
            <Field label="Duración (min)">
              <Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
            </Field>
          </div>
          <Field label="Notas">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button disabled={!form.scheduled_at || saveAppointment.isPending} onClick={submit}>
            {saveAppointment.isPending ? 'Guardando...' : 'Agendar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar cita"
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteAppointment.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}

function BaysManager({ isAdmin }: { isAdmin: boolean }) {
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
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button onClick={openNew}>
            <Plus size={16} /> Nueva bahía
          </Button>
        </div>
      )}

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
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(b)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
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
