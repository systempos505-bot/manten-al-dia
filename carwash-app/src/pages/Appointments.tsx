import { useMemo, useState } from 'react'
import { Plus, Clock, Car, User, Trash2 } from 'lucide-react'
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
  useDeleteAppointment,
  type AppointmentWithRelations,
} from '../hooks/useAppointments'
import { useClients, useClientVehicles } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { formatDateTime } from '../lib/format'
import type { AppointmentStatus } from '../types/database'

const statusTone: Record<AppointmentStatus, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  pendiente: 'gray',
  confirmada: 'blue',
  en_proceso: 'yellow',
  completada: 'green',
  cancelada: 'red',
}

const statusLabel: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

function startOfDayISO(daysFromToday = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function Appointments() {
  const range = useMemo(() => ({ from: startOfDayISO(-7), to: startOfDayISO(30) }), [])
  const { data: appointments, isLoading } = useAppointments(range)
  const { data: clients } = useClients()
  const { data: employees } = useEmployees(true)
  const { data: services } = useCatalogItems('service')
  const saveAppointment = useSaveAppointment()
  const setStatus = useSetAppointmentStatus()
  const deleteAppointment = useDeleteAppointment()

  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AppointmentWithRelations | null>(null)
  const [form, setForm] = useState({
    client_id: '',
    vehicle_id: '',
    employee_id: '',
    service_item_id: '',
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
        description="Agenda de servicios programados"
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> Nueva cita
          </Button>
        }
      />

      {isLoading ? (
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
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
