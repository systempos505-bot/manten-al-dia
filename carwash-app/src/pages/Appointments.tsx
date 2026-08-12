import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, Car, User, Trash2, Warehouse, Minus, X } from 'lucide-react'
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
  useActiveBayAppointments,
  useSaveAppointment,
  useSetAppointmentStatus,
  useSetAppointmentBay,
  useDeleteAppointment,
  type AppointmentWithRelations,
} from '../hooks/useAppointments'
import { useClients, useClientVehicles } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { useBays } from '../hooks/useBays'
import { useFormatCurrency } from '../hooks/useCurrency'
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

type BayBoardStatus = 'libre' | 'pendiente' | 'en_proceso' | 'listo'

const bayBoardStyle: Record<BayBoardStatus, { card: string; tone: 'gray' | 'yellow' | 'blue' | 'green'; label: string }> = {
  libre: { card: 'border-slate-200 bg-white', tone: 'gray', label: 'Libre' },
  pendiente: { card: 'border-amber-300 bg-amber-50', tone: 'yellow', label: 'Pendiente' },
  en_proceso: { card: 'border-blue-300 bg-blue-50', tone: 'blue', label: 'En lavado' },
  listo: { card: 'border-emerald-300 bg-emerald-50', tone: 'green', label: 'Terminado' },
}

function startOfDayISO(daysFromToday = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function Appointments() {
  const navigate = useNavigate()
  const range = useMemo(() => ({ from: startOfDayISO(-7), to: startOfDayISO(30) }), [])
  const { data: appointments, isLoading } = useAppointments(range)
  const { data: activeBayAppointments } = useActiveBayAppointments()
  const { data: clients } = useClients()
  const { data: employees } = useEmployees(true)
  const { data: services } = useCatalogItems('service')
  const { data: products } = useCatalogItems('product')
  const { data: bays } = useBays(true)
  const formatMoney = useFormatCurrency()
  const saveAppointment = useSaveAppointment()
  const setStatus = useSetAppointmentStatus()
  const setBay = useSetAppointmentBay()
  const deleteAppointment = useDeleteAppointment()

  const [tab, setTab] = useState<'agenda' | 'bahias'>('agenda')
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

  // ----- Tablero de bahías -----
  const sellableItems = useMemo(
    () => [...(services ?? []), ...(products ?? [])].filter((i) => i.sellable && i.active),
    [services, products],
  )

  const bayOccupancy = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations>()
    for (const a of activeBayAppointments ?? []) {
      if (a.bay_id && !map.has(a.bay_id)) map.set(a.bay_id, a)
    }
    return map
  }, [activeBayAppointments])

  const [boardModal, setBoardModal] = useState<Bay | null>(null)
  const [sessionClientId, setSessionClientId] = useState('')
  const [sessionVehicleId, setSessionVehicleId] = useState('')
  const [sessionEmployeeId, setSessionEmployeeId] = useState('')
  const [sessionItems, setSessionItems] = useState<{ item_id: string; item_name: string; qty: number }[]>([])
  const [sessionItemToAdd, setSessionItemToAdd] = useState('')
  const { data: sessionVehicles } = useClientVehicles(sessionClientId || null)

  function openBayFree(bay: Bay) {
    setSessionClientId('')
    setSessionVehicleId('')
    setSessionEmployeeId('')
    setSessionItems([])
    setSessionItemToAdd('')
    setBoardModal(bay)
  }

  function addSessionItem() {
    if (!sessionItemToAdd) return
    const item = sellableItems.find((i) => i.id === sessionItemToAdd)
    if (!item) return
    setSessionItems((prev) => {
      const existing = prev.find((p) => p.item_id === item.id)
      if (existing) return prev.map((p) => (p.item_id === item.id ? { ...p, qty: p.qty + 1 } : p))
      return [...prev, { item_id: item.id, item_name: item.name, qty: 1 }]
    })
    setSessionItemToAdd('')
  }

  function updateSessionItemQty(itemId: string, qty: number) {
    setSessionItems((prev) => prev.map((p) => (p.item_id === itemId ? { ...p, qty: Math.max(qty, 0.01) } : p)))
  }

  function removeSessionItem(itemId: string) {
    setSessionItems((prev) => prev.filter((p) => p.item_id !== itemId))
  }

  async function submitSession() {
    if (!boardModal) return
    const items = sessionItems.map((it) => ({ item_id: it.item_id, qty: it.qty }))
    await saveAppointment.mutateAsync({
      client_id: sessionClientId || null,
      vehicle_id: sessionVehicleId || null,
      employee_id: sessionEmployeeId || null,
      bay_id: boardModal.id,
      scheduled_at: new Date().toISOString(),
      duration_min: 45,
      status: 'pendiente',
      items,
    })
    setBoardModal(null)
  }

  return (
    <div>
      <PageHeader
        title="Citas"
        description="Agenda de servicios y seguimiento de lavados en curso"
        action={
          tab === 'agenda' ? (
            <Button onClick={openNew}>
              <Plus size={16} /> Nueva cita
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 flex gap-1 rounded-xl bg-slate-200/70 p-1 sm:inline-flex">
        <button
          onClick={() => setTab('agenda')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
            tab === 'agenda' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setTab('bahias')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
            tab === 'bahias' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          Bahías en vivo
        </button>
      </div>

      {tab === 'bahias' ? (
        <div>
          {!bays || bays.length === 0 ? (
            <EmptyState
              title="No hay bahías activas"
              description="Crea tus bahías en Configuración > Bahías para usar este tablero."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {bays.map((bay) => {
                const appt = bayOccupancy.get(bay.id) || null
                const boardStatus: BayBoardStatus =
                  appt && (appt.status === 'pendiente' || appt.status === 'en_proceso' || appt.status === 'listo')
                    ? appt.status
                    : appt
                      ? 'pendiente'
                      : 'libre'
                const style = bayBoardStyle[boardStatus]
                return (
                  <button
                    key={bay.id}
                    onClick={() => (appt ? navigate(`/pos?bay=${bay.id}`) : openBayFree(bay))}
                    className={`rounded-2xl border-2 p-4 text-left transition hover:shadow-md ${style.card}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800">{bay.name}</p>
                      <Badge tone={style.tone}>{style.label}</Badge>
                    </div>
                    {appt ? (
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        {appt.client ? (
                          <span className="flex items-center gap-1 truncate">
                            <User size={13} className="shrink-0" /> {appt.client.full_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin cliente</span>
                        )}
                        {appt.vehicle && (
                          <span className="flex items-center gap-1 truncate">
                            <Car size={13} className="shrink-0" /> {appt.vehicle.brand} {appt.vehicle.model}
                          </span>
                        )}
                        {appt.appointment_items && appt.appointment_items.length > 0 && (
                          <span className="truncate text-xs text-slate-500">
                            {appt.appointment_items.map((it) => it.catalog_items?.name).filter(Boolean).join(', ')}
                          </span>
                        )}
                        <span className="mt-1 text-xs font-bold text-brand-600">Toca para ver y cobrar en el POS</span>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">Toca para iniciar un lavado</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : isLoading ? (
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

      <Modal
        open={boardModal !== null}
        title={boardModal ? `Bahía: ${boardModal.name}` : ''}
        onClose={() => setBoardModal(null)}
        wide
      >
        {boardModal && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cliente">
                <Select
                  value={sessionClientId}
                  onChange={(e) => {
                    setSessionClientId(e.target.value)
                    setSessionVehicleId('')
                  }}
                >
                  <option value="">Sin cliente</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Vehículo">
                <Select value={sessionVehicleId} onChange={(e) => setSessionVehicleId(e.target.value)} disabled={!sessionClientId}>
                  <option value="">Sin vehículo</option>
                  {sessionVehicles?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.plate && `· ${v.plate}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Empleado">
                <Select value={sessionEmployeeId} onChange={(e) => setSessionEmployeeId(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Servicios y productos</p>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={sessionItemToAdd}
                  onChange={(e) => setSessionItemToAdd(e.target.value)}
                  className="min-w-[160px] flex-1"
                >
                  <option value="">Selecciona...</option>
                  {sellableItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} · {formatMoney(i.price)}
                    </option>
                  ))}
                </Select>
                <Button variant="secondary" onClick={addSessionItem} disabled={!sessionItemToAdd} className="shrink-0">
                  <Plus size={15} /> Agregar
                </Button>
              </div>
              {sessionItems.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {sessionItems.map((it) => (
                    <div key={it.item_id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{it.item_name}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => updateSessionItemQty(it.item_id, it.qty - 1)}
                          className="grid h-6 w-6 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{it.qty}</span>
                        <button
                          onClick={() => updateSessionItemQty(it.item_id, it.qty + 1)}
                          className="grid h-6 w-6 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeSessionItem(it.item_id)} className="shrink-0 text-slate-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button disabled={saveAppointment.isPending} onClick={submitSession} className="w-full">
              {saveAppointment.isPending ? 'Guardando...' : 'Iniciar lavado'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
