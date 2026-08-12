import { useState } from 'react'
import { Check } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { useCatalogItems, useSaveCatalogItem } from '../../hooks/useCatalogItems'
import { useFormatCurrency } from '../../hooks/useCurrency'

export function UpdatePrices() {
  const formatMoney = useFormatCurrency()
  const { data: items, isLoading } = useCatalogItems()
  const saveItem = useSaveCatalogItem()
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [savedId, setSavedId] = useState<string | null>(null)

  function setPrice(id: string, value: string) {
    setEdited((prev) => ({ ...prev, [id]: value }))
  }

  async function savePrice(id: string) {
    const value = edited[id]
    if (value === undefined) return
    await saveItem.mutateAsync({ id, price: Number(value) || 0 })
    setEdited((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSavedId(id)
    setTimeout(() => setSavedId((current) => (current === id ? null : current)), 1500)
  }

  return (
    <div>
      <PageHeader title="Actualizar Precio" description="Edita rápidamente el precio de venta de tus productos y servicios" />

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !items || items.length === 0 ? (
          <EmptyState title="Sin productos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Precio actual</th>
                  <th className="px-5 py-3">Nuevo precio</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const value = edited[item.id]
                  const dirty = value !== undefined && Number(value) !== item.price
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-5 py-3 text-slate-500">{item.type === 'product' ? 'Simple' : 'Servicio'}</td>
                      <td className="px-5 py-3 text-slate-500">{formatMoney(item.price)}</td>
                      <td className="px-5 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={value ?? String(item.price)}
                          onChange={(e) => setPrice(item.id, e.target.value)}
                          className="!w-32"
                        />
                      </td>
                      <td className="px-5 py-3">
                        {dirty && (
                          <button
                            onClick={() => savePrice(item.id)}
                            disabled={saveItem.isPending}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check size={13} /> Guardar
                          </button>
                        )}
                        {savedId === item.id && <span className="text-xs font-semibold text-emerald-600">Guardado ✓</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
