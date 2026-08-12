import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { useSaveCatalogItem } from '../../hooks/useCatalogItems'
import { useProductUnits } from '../../hooks/useProductUnits'
import { useProductCategories } from '../../hooks/useProductCategories'
import type { CatalogItemType } from '../../types/database'

const emptyForm = {
  type: 'product' as CatalogItemType,
  name: '',
  description: '',
  category_id: '',
  price: '0',
  cost: '0',
  sellable: true,
  track_inventory: false,
  stock_qty: '0',
  min_stock: '0',
  unit: '',
}

export function CreateProduct() {
  const navigate = useNavigate()
  const saveItem = useSaveCatalogItem()
  const { data: units } = useProductUnits()
  const { data: categories } = useProductCategories()
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)

  async function saveCurrent() {
    await saveItem.mutateAsync({
      type: form.type,
      name: form.name,
      description: form.description || null,
      category_id: form.category_id || null,
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      sellable: form.sellable,
      track_inventory: form.track_inventory,
      stock_qty: Number(form.stock_qty) || 0,
      min_stock: Number(form.min_stock) || 0,
      unit: form.unit || units?.[0]?.name || 'Pieza',
    })
  }

  async function submitAndGoToList() {
    await saveCurrent()
    navigate('/productos/lista')
  }

  async function submitAndCreateAnother() {
    await saveCurrent()
    setForm({ ...emptyForm, type: form.type })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Producto" description="Registra un nuevo producto o servicio en tu catálogo" />

      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Tipo de producto">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CatalogItemType })}>
              <option value="product">Simple</option>
              <option value="service">Servicio</option>
            </Select>
          </Field>
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unidad">
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="">Selecciona...</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Descripción">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio de venta">
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Costo">
              <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.sellable}
              onChange={(e) => setForm({ ...form, sellable: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Se puede vender en el punto de venta
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.track_inventory}
              onChange={(e) => setForm({ ...form, track_inventory: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Controlar inventario (descuenta stock al vender)
          </label>

          {form.track_inventory && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock actual">
                <Input type="number" step="0.01" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
              </Field>
              <Field label="Stock mínimo">
                <Input type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!form.name || saveItem.isPending} onClick={submitAndGoToList}>
              {saveItem.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="secondary" disabled={!form.name || saveItem.isPending} onClick={submitAndCreateAnother}>
              Guardar y crear otro
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
