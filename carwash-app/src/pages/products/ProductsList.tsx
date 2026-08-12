import { useState } from 'react'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Loading } from '../../components/ui/Loading'
import { Button } from '../../components/ui/Button'
import { useCatalogItems, useSaveCatalogItem, useDeleteCatalogItem } from '../../hooks/useCatalogItems'
import { useProductUnits } from '../../hooks/useProductUnits'
import { useProductCategories } from '../../hooks/useProductCategories'
import { useFormatCurrency, useFormatQuantity } from '../../hooks/useCurrency'
import { useAuth } from '../../context/AuthContext'
import type { CatalogItem, CatalogItemType } from '../../types/database'

export function ProductsList() {
  const formatMoney = useFormatCurrency()
  const formatQty = useFormatQuantity()
  const { can } = useAuth()
  const canEdit = can('catalogo_editar')
  const [tab, setTab] = useState<CatalogItemType>('product')
  const { data: items, isLoading } = useCatalogItems(tab)
  const { data: units } = useProductUnits()
  const { data: categories } = useProductCategories()
  const saveItem = useSaveCatalogItem()
  const deleteItem = useDeleteCatalogItem()

  const [modal, setModal] = useState<{ open: boolean; editing: CatalogItem | null }>({ open: false, editing: null })
  const [form, setForm] = useState({
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
  })
  const [confirmDelete, setConfirmDelete] = useState<CatalogItem | null>(null)

  function categoryName(id: string | null) {
    if (!id) return '—'
    return categories?.find((c) => c.id === id)?.name ?? '—'
  }

  function openEdit(item: CatalogItem) {
    setForm({
      type: item.type,
      name: item.name,
      description: item.description ?? '',
      category_id: item.category_id ?? '',
      price: String(item.price),
      cost: String(item.cost),
      sellable: item.sellable,
      track_inventory: item.track_inventory,
      stock_qty: String(item.stock_qty),
      min_stock: String(item.min_stock),
      unit: item.unit,
    })
    setModal({ open: true, editing: item })
  }

  async function submit() {
    if (!modal.editing) return
    await saveItem.mutateAsync({
      id: modal.editing.id,
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
      unit: form.unit || 'Pieza',
    })
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <PageHeader title="Lista de Productos" description="Catálogo de productos, insumos y servicios" />

      <div className="mb-5 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
        <button
          onClick={() => setTab('product')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'product' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Simple
        </button>
        <button
          onClick={() => setTab('service')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'service' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Servicio
        </button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <Loading />
        ) : !items || items.length === 0 ? (
          <EmptyState title={tab === 'service' ? 'Sin servicios registrados' : 'Sin productos registrados'} description="Agrega tu primer artículo desde 'Crear Producto'." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Precio</th>
                  {tab === 'product' && <th className="px-5 py-3">Costo</th>}
                  {tab === 'product' && <th className="px-5 py-3">Stock</th>}
                  <th className="px-5 py-3">Estado</th>
                  {canEdit && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const lowStock = item.track_inventory && item.stock_qty <= item.min_stock
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{categoryName(item.category_id)}</td>
                      <td className="px-5 py-3 font-semibold">{formatMoney(item.price)}</td>
                      {tab === 'product' && <td className="px-5 py-3">{formatMoney(item.cost)}</td>}
                      {tab === 'product' && (
                        <td className="px-5 py-3">
                          {item.track_inventory ? (
                            <span className={`flex items-center gap-1 font-semibold ${lowStock ? 'text-red-600' : 'text-slate-700'}`}>
                              {lowStock && <AlertTriangle size={13} />}
                              {formatQty(item.stock_qty)} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400">No aplica</span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3">
                        {item.active ? <Badge tone="green">Activo</Badge> : <Badge tone="gray">Inactivo</Badge>}
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(item)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal.open} title="Editar artículo" onClose={() => setModal({ open: false, editing: null })}>
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
            <div className="grid grid-cols-3 gap-4">
              <Field label="Stock actual">
                <Input type="number" step="0.01" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
              </Field>
              <Field label="Stock mínimo">
                <Input type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
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
          )}

          <Button disabled={!form.name || saveItem.isPending} onClick={submit}>
            {saveItem.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Eliminar artículo"
        description={`Se eliminará "${confirmDelete?.name}" del catálogo.`}
        danger
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteItem.mutateAsync(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </div>
  )
}
