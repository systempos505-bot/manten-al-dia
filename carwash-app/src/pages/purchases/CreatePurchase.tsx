import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { useCreatePurchase, type PurchaseDraftItem } from '../../hooks/usePurchases'
import { useCatalogItems } from '../../hooks/useCatalogItems'
import { useFormatCurrency } from '../../hooks/useCurrency'
import { todayISODate } from '../../lib/format'

export function CreatePurchase() {
  const formatMoney = useFormatCurrency()
  const { data: products } = useCatalogItems('product')
  const createPurchase = useCreatePurchase()

  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(todayISODate())
  const [notes, setNotes] = useState('')
  const [draftItems, setDraftItems] = useState<PurchaseDraftItem[]>([])
  const [pickItem, setPickItem] = useState('')
  const [qty, setQty] = useState('1')
  const [unitCost, setUnitCost] = useState('0')
  const [saved, setSaved] = useState(false)

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
    setSupplier('')
    setNotes('')
    setDraftItems([])
    setDate(todayISODate())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Compra" description="Reabastece tu inventario; cada compra genera el gasto automáticamente" />

      <Card className="max-w-2xl">
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

          <div className="flex items-center gap-3">
            <Button disabled={draftItems.length === 0 || !supplier || createPurchase.isPending} onClick={submit}>
              {createPurchase.isPending ? 'Guardando...' : 'Registrar compra'}
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
