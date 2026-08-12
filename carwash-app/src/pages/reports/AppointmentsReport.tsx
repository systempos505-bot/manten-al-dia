import { useMemo } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { EmptyState } from '../../components/ui/EmptyState'
import { RangeSwitcher } from '../../components/ui/RangeSwitcher'
import { useAppointments } from '../../hooks/useAppointments'
import { useReportRange } from '../../hooks/useReportRange'
import type { AppointmentStatus } from '../../types/database'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_espera: 'En espera',
  en_proceso: 'Lavando',
  listo: 'Listo para entregar',
  completada: 'Entregado',
  cancelada: 'Cancelada',
}

export function AppointmentsReport() {
  const { days, setDays, range } = useReportRange()
  const { data: appointments, isLoading } = useAppointments(range)

  const byStatus = useMemo(() => {
    const map = new Map<AppointmentStatus, number>()
    for (const a of appointments ?? []) {
      map.set(a.status, (map.get(a.status) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [appointments])

  const byEmployee = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of appointments ?? []) {
      const name = a.employee?.full_name || 'Sin asignar'
      map.set(name, (map.get(name) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [appointments])

  return (
    <div>
      <PageHeader title="Reporte de Citas" description="Citas y lavados en el periodo seleccionado" />

      <RangeSwitcher days={days} onChange={setDays} />

      {isLoading || !appointments ? (
        <Loading />
      ) : (
        <div className="grid gap-6">
          <Card>
            <p className="text-xs font-bold uppercase text-slate-500">Total de citas</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{appointments.length}</p>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-0">
              <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Por estado</p>
              {byStatus.length === 0 ? (
                <EmptyState title="Sin citas en el periodo" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {byStatus.map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="font-semibold text-slate-800">{STATUS_LABELS[status]}</span>
                      <span className="font-bold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-0">
              <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Por empleado</p>
              {byEmployee.length === 0 ? (
                <EmptyState title="Sin datos" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {byEmployee.map(([name, count]) => (
                    <li key={name} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="font-semibold text-slate-800">{name}</span>
                      <span className="font-bold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
