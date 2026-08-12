import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { EmptyState } from '../../components/ui/EmptyState'
import { RangeSwitcher } from '../../components/ui/RangeSwitcher'
import { useDashboardData } from '../../hooks/useDashboard'
import { useFormatCurrency } from '../../hooks/useCurrency'
import { useReportRange } from '../../hooks/useReportRange'

export function ExpensesReport() {
  const formatMoney = useFormatCurrency()
  const { days, setDays, range } = useReportRange()
  const { data, isLoading } = useDashboardData(range)

  return (
    <div>
      <PageHeader title="Reporte de Gastos" description="Gastos del negocio en el periodo seleccionado" />

      <RangeSwitcher days={days} onChange={setDays} />

      {isLoading || !data ? (
        <Loading />
      ) : (
        <div className="grid gap-6">
          <Card>
            <p className="text-xs font-bold uppercase text-slate-500">Gastos totales</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatMoney(data.totalExpenses)}</p>
          </Card>

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
