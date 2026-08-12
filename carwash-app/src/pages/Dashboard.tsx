import { useMemo } from 'react'
import { DollarSign, Receipt, CalendarClock, AlertTriangle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useDashboardData } from '../hooks/useDashboard'
import { useAppointments } from '../hooks/useAppointments'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDateTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'

function todayRange() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function Dashboard() {
  const { businessName } = useAuth()
  const formatMoney = useFormatCurrency()
  const range = useMemo(todayRange, [])
  const { data, isLoading } = useDashboardData(range)
  const { data: upcoming } = useAppointments({ from: new Date().toISOString(), to: new Date(Date.now() + 3 * 86400000).toISOString() })

  return (
    <div>
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-7 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-white/60">Hoy</p>
        <h1 className="mt-1 text-2xl font-extrabold">{businessName || 'Tu auto lavado'}</h1>
        <p className="mt-1 text-white/70">Resumen del día y próximas citas.</p>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign size={16} />
                <p className="text-xs font-bold uppercase">Ventas hoy</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney(data?.totalSales ?? 0)}</p>
              <p className="text-xs text-slate-400">{data?.salesCount ?? 0} ticket(s)</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-slate-500">
                <Receipt size={16} />
                <p className="text-xs font-bold uppercase">Gastos hoy</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney(data?.totalExpenses ?? 0)}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign size={16} />
                <p className="text-xs font-bold uppercase">Utilidad</p>
              </div>
              <p className={`mt-2 text-2xl font-extrabold ${((data?.netProfit ?? 0) < 0) ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatMoney(data?.netProfit ?? 0)}
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarClock size={16} />
                <p className="text-xs font-bold uppercase">Citas hoy</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{data?.appointmentsCount ?? 0}</p>
              <p className="text-xs text-slate-400">{data?.appointmentsPending ?? 0} pendientes</p>
            </Card>
          </div>

          {data && data.lowStock.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle size={16} />
                <p className="text-sm font-bold">Inventario bajo</p>
              </div>
              <ul className="mt-2 grid gap-1 text-sm text-amber-800">
                {data.lowStock.map((i: any) => (
                  <li key={i.id}>
                    {i.name}: quedan {i.stock_qty} {i.unit} (mínimo {i.min_stock})
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Próximas citas</h2>
        {!upcoming || upcoming.length === 0 ? (
          <EmptyState title="No hay citas próximas" />
        ) : (
          <div className="grid gap-2">
            {upcoming.slice(0, 6).map((a) => (
              <Card key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{formatDateTime(a.scheduled_at)}</p>
                  <p className="text-sm text-slate-500">
                    {a.client?.full_name || 'Sin cliente'} {a.vehicle?.plate && `· ${a.vehicle.plate}`}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase text-brand-600">{a.status}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
