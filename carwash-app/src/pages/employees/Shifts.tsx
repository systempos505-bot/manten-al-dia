import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { useEmployees, useShifts, useClockIn, useClockOut } from '../../hooks/useEmployees'
import { formatDateTime } from '../../lib/format'
import { LogIn, LogOut } from 'lucide-react'

export function Shifts() {
  const { data: employees } = useEmployees()
  const { data: shifts, isLoading: loadingShifts } = useShifts()
  const clockIn = useClockIn()
  const clockOut = useClockOut()

  const openShiftByEmployee = new Map((shifts ?? []).filter((s) => !s.clock_out).map((s) => [s.employee_id, s]))

  return (
    <div>
      <PageHeader title="Turnos" description="Control de entradas y salidas del personal" />

      <div className="grid gap-6">
        <Card>
          <p className="mb-3 text-sm font-bold text-slate-700">Registrar entrada / salida</p>
          <div className="grid gap-2">
            {employees?.filter((e) => e.active).map((e) => {
              const open = openShiftByEmployee.get(e.id)
              return (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                  <span className="font-semibold text-slate-800">{e.full_name}</span>
                  {open ? (
                    <Button size="sm" variant="secondary" onClick={() => clockOut.mutate(open.id)}>
                      <LogOut size={14} /> Salida
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => clockIn.mutate(e.id)}>
                      <LogIn size={14} /> Entrada
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-0">
          {loadingShifts ? (
            <Loading />
          ) : !shifts || shifts.length === 0 ? (
            <EmptyState title="Sin turnos registrados" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Empleado</th>
                    <th className="px-5 py-3">Entrada</th>
                    <th className="px-5 py-3">Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3 font-semibold">{s.employee?.full_name}</td>
                      <td className="px-5 py-3">{formatDateTime(s.clock_in)}</td>
                      <td className="px-5 py-3">{s.clock_out ? formatDateTime(s.clock_out) : <Badge tone="blue">En turno</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
