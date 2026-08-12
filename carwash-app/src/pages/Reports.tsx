import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useDashboardData } from '../hooks/useDashboard'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDate } from '../lib/format'

const ranges = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

export function Reports() {
  const formatMoney = useFormatCurrency()
  const [days, setDays] = useState(30)
  const range = useMemo(() => {
    const from = new Date()
    from.setDate(from.getDate() - (days - 1))
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [days])

  const { data, isLoading } = useDashboardData(range)

  return (
    <div>
      <PageHeader title="Reportes" description="Desempeño del negocio en el periodo seleccionado" />

      <div className="mb-5 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
        {ranges.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${days === r.days ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase text-slate-500">Ventas totales</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatMoney(data.totalSales)}</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase text-slate-500">Gastos totales</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatMoney(data.totalExpenses)}</p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase text-slate-500">Utilidad neta</p>
              <p className={`mt-1 text-2xl font-extrabold ${data.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatMoney(data.netProfit)}
              </p>
            </Card>
          </div>

          <Card>
            <p className="mb-4 font-bold text-slate-800">Ventas por día</p>
            {data.salesByDay.length === 0 ? (
              <EmptyState title="Sin ventas en el periodo" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} labelFormatter={(d) => formatDate(d as string)} />
                    <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-0">
              <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Ventas por empleado</p>
              {data.byEmployee.length === 0 ? (
                <EmptyState title="Sin datos" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.byEmployee.map((e) => (
                    <li key={e.name} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="font-semibold text-slate-800">{e.name}</span>
                      <span className="text-right">
                        <p className="font-bold">{formatMoney(e.total)}</p>
                        <p className="text-xs text-slate-400">comisión {formatMoney(e.commission)}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-0">
              <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Servicios / productos más vendidos</p>
              {data.topItems.length === 0 ? (
                <EmptyState title="Sin datos" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.topItems.map((i) => (
                    <li key={i.name} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="font-semibold text-slate-800">
                        {i.name} <span className="text-slate-400">× {i.qty}</span>
                      </span>
                      <span className="font-bold">{formatMoney(i.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-0">
            <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Gastos por categoría</p>
            {data.byExpenseCategory.length === 0 ? (
              <EmptyState title="Sin gastos en el periodo" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.byExpenseCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{c.category}</span>
                    <span className="font-bold">{formatMoney(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
