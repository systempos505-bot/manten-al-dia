import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCatalogItems } from '../../hooks/useCatalogItems'
import { useFormatQuantity } from '../../hooks/useCurrency'

export function InventoryReport() {
  const formatQty = useFormatQuantity()
  const { data: items, isLoading } = useCatalogItems('product')

  const tracked = useMemo(() => (items ?? []).filter((i) => i.track_inventory), [items])
  const lowStock = useMemo(() => tracked.filter((i) => i.stock_qty <= i.min_stock), [tracked])

  return (
    <div>
      <PageHeader title="Reporte de Inventario" description="Existencias actuales de productos" />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-xs font-bold uppercase text-slate-500">Productos con inventario</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{tracked.length}</p>
            </Card>
            <Card className={lowStock.length > 0 ? 'border-amber-200 bg-amber-50' : ''}>
              <p className="text-xs font-bold uppercase text-slate-500">Inventario bajo</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-700">{lowStock.length}</p>
            </Card>
          </div>

          {lowStock.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-0">
              <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-3">
                <AlertTriangle size={16} className="text-amber-700" />
                <p className="font-bold text-amber-800">Necesitan reabastecerse</p>
              </div>
              <ul className="divide-y divide-amber-200/70">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm text-amber-800">
                    <span className="font-semibold">{i.name}</span>
                    <span>
                      quedan {formatQty(i.stock_qty)} {i.unit} (mínimo {formatQty(i.min_stock)})
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-0">
            <p className="border-b border-slate-100 px-5 py-3 font-bold text-slate-800">Todas las existencias</p>
            {tracked.length === 0 ? (
              <EmptyState title="Sin productos con control de inventario" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {tracked.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{i.name}</span>
                    <span className={i.stock_qty <= i.min_stock ? 'font-bold text-red-600' : 'font-bold text-slate-700'}>
                      {formatQty(i.stock_qty)} {i.unit}
                    </span>
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
