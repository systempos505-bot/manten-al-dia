import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { useExpenses } from '../../hooks/useExpenses'
import { useFormatCurrency } from '../../hooks/useCurrency'
import { formatDate } from '../../lib/format'

export function ExpensesList() {
  const formatMoney = useFormatCurrency()
  const { data: expenses, isLoading } = useExpenses()

  return (
    <div>
      <PageHeader title="Lista de Gastos" description="Historial de gastos registrados" />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState title="Sin gastos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">{formatDate(e.expense_date)}</td>
                    <td className="px-5 py-3 font-semibold">{e.category}</td>
                    <td className="px-5 py-3 text-slate-500">{e.description || '—'}</td>
                    <td className="px-5 py-3 font-semibold text-red-600">{formatMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
