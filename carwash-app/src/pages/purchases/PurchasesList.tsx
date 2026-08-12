import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { usePurchases } from '../../hooks/usePurchases'
import { useFormatCurrency } from '../../hooks/useCurrency'
import { formatDate } from '../../lib/format'

export function PurchasesList() {
  const formatMoney = useFormatCurrency()
  const { data: purchases, isLoading } = usePurchases()

  return (
    <div>
      <PageHeader title="Lista de Compras" description="Historial de compras a proveedores" />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !purchases || purchases.length === 0 ? (
          <EmptyState title="Sin compras registradas" description="Registra compras a proveedores para reponer inventario." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Proveedor</th>
                  <th className="px-5 py-3">Artículos</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">{formatDate(p.purchase_date)}</td>
                    <td className="px-5 py-3 font-semibold">{p.supplier_name || 'Sin nombre'}</td>
                    <td className="px-5 py-3 text-slate-500">{p.purchase_items?.length ?? 0} artículo(s)</td>
                    <td className="px-5 py-3 font-semibold">{formatMoney(p.total)}</td>
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
