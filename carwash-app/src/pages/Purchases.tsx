import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { usePurchases, useCreatePurchase, type PurchaseDraftItem } from '../hooks/usePurchases'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDate, todayISODate } from '../lib/format'

export function Purchases() {
  const formatMoney = useFormatCurrency()
  const { data: purchases, isLoading } = usePurchases()
  const { data: products } = useCatalogItems('product')
  const createPurchase = useCreatePurchase()

  const [open, setOpen] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(todayISODate())
  const [notes, setNotes] = useState('')
  const [draftItems, setDraftItems] = useState<PurchaseDraftItem[]>([])
  const [pickItem, setPickItem] = useState('')
  const [qty, setQty] = useState('1')
  const [unitCost, setUnitCost] = useState('0')

  const total = draftItems.reduce((sum, it) => sum + it.qty * it.unit_cost, 0)

  function addItem() {
    if (!pickItem) return
    setDraftItems((prev) => [...prev, { item_id: pickItem, qty: Number(qty) || 1, unit_cost: Number(unitCost) || 0 }])
    setPickItem('')
    setQty('1')
    setUnitCost('0')
  }

  function itemName(id: string) {
    return products?.find((p) => p.id === id)?.name ?? 'Artículo'
  }

  async function submit() {
    if (draftItems.length === 0 || !supplier) return
    await createPurchase.mutateAsync({ supplier_name: supplier, purchase_date: date, notes, items: draftItems })
    setOpen(false)
    setSupplier('')
    setNotes('')
    setDraftItems([])
    setDate(todayISODate())
  }

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Reabastece tu inventario de insumos y productos; cada compra genera el gasto automáticamente"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nueva compra
          </Button>
        }
      />

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

      <Modal open={open} title="Nueva compra" onClose={() => setOpen(false)} wide>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Proveedor">
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Distribuidora XYZ" />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Agregar artículo</p>
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3">
              <Select value={pickItem} onChange={(e) => setPickItem(e.target.value)}>
                <option value="">Selecciona un producto...</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </Select>
              <Input type="number" step="0.01" placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
              <Input type="number" step="0.01" placeholder="Costo unit." value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
              <Button type="button" variant="secondary" onClick={addItem}>
                Agregar
              </Button>
            </div>
          </div>

          {draftItems.length > 0 && (
            <div className="grid gap-2">
              {draftItems.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="font-semibold">
                    {itemName(it.item_id)} × {it.qty}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{formatMoney(it.qty * it.unit_cost)}</span>
                    <button onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end text-base font-bold">Total: {formatMoney(total)}</div>
            </div>
          )}

          <Button disabled={draftItems.length === 0 || !supplier || createPurchase.isPending} onClick={submit}>
            {createPurchase.isPending ? 'Guardando...' : 'Registrar compra'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
