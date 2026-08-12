import { useMemo, useState } from 'react'
import { Trash2, ShoppingCart, CheckCircle2, Search, Minus, Plus, ChevronDown, Droplets, Package as PackageIcon, LayoutGrid } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { useClients, useClientVehicles } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useBays } from '../hooks/useBays'
import { useCreateSale, useSales, type SaleDraftItem } from '../hooks/useSales'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDateTime } from '../lib/format'
import type { CatalogItemType, PaymentMethod } from '../types/database'

export function Pos() {
  const formatMoney = useFormatCurrency()
  const { data: services } = useCatalogItems('service')
  const { data: products } = useCatalogItems('product')
  const { data: clients } = useClients()
  const { data: employees } = useEmployees(true)
  const { data: bays } = useBays(true)
  const { data: recentSales } = useSales(8)
  const createSale = useCreateSale()

  const [tab, setTab] = useState<CatalogItemType>('service')
  const [search, setSearch] = useState('')
  const [recentOpen, setRecentOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')

  const visibleItems = useMemo(() => {
    const list = (tab === 'service' ? services : products) ?? []
    const filtered = list.filter((i) => i.sellable && i.active)
    if (!search.trim()) return filtered
    const q = search.trim().toLowerCase()
    return filtered.filter((i) => i.name.toLowerCase().includes(q))
  }, [tab, services, products, search])

  const sellableItems = useMemo(
    () => [...(services ?? []), ...(products ?? [])].filter((i) => i.sellable && i.active),
    [services, products],
  )

  const [clientId, setClientId] = useState('')
  const { data: vehicles } = useClientVehicles(clientId || null)
  const [vehicleId, setVehicleId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [bayId, setBayId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [discount, setDiscount] = useState('0')
  const [cart, setCart] = useState<SaleDraftItem[]>([])
  const [success, setSuccess] = useState(false)

  const subtotal = cart.reduce((sum, it) => sum + it.qty * it.unit_price, 0)
  const total = Math.max(subtotal - (Number(discount) || 0), 0)

  function addToCart(itemId: string) {
    const item = sellableItems.find((i) => i.id === itemId)
    if (!item) return
    setCart((prev) => {
      const existing = prev.find((p) => p.item_id === itemId)
      if (existing) {
        return prev.map((p) => (p.item_id === itemId ? { ...p, qty: p.qty + 1 } : p))
      }
      return [
        ...prev,
        {
          item_id: item.id,
          item_name: item.name,
          item_type: item.type,
          qty: 1,
          unit_price: item.price,
          commission_pct: 0,
        },
      ]
    })
  }

  function updateQty(itemId: string, qty: number) {
    setCart((prev) => prev.map((p) => (p.item_id === itemId ? { ...p, qty: Math.max(qty, 0.01) } : p)))
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((p) => p.item_id !== itemId))
  }

  async function checkout() {
    if (cart.length === 0) return
    const employee = employees?.find((e) => e.id === employeeId)
    const items = cart.map((it) => ({ ...it, commission_pct: employee?.commission_pct ?? 0 }))
    await createSale.mutateAsync({
      client_id: clientId || null,
      vehicle_id: vehicleId || null,
      employee_id: employeeId || null,
      appointment_id: null,
      bay_id: bayId || null,
      payment_method: paymentMethod,
      discount: Number(discount) || 0,
      items,
    })
    setCart([])
    setDiscount('0')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const cartCount = cart.reduce((sum, it) => sum + it.qty, 0)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 gap-1 rounded-xl bg-slate-200/70 p-1 lg:hidden">
        <button
          onClick={() => setMobileView('products')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
            mobileView === 'products' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          <LayoutGrid size={15} /> Productos
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
            mobileView === 'cart' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          <ShoppingCart size={15} /> Carrito
          {cartCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] lg:gap-5">
      <Card className={`min-h-0 h-full flex-col ${mobileView === 'products' ? 'flex' : 'hidden'} lg:flex`}>
        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Cliente">
            <Select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setVehicleId('')
              }}
            >
              <option value="">Cliente general</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Empleado que atiende">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Sin asignar</option>
              {employees?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bahía">
            <Select value={bayId} onChange={(e) => setBayId(e.target.value)}>
              <option value="">Sin asignar</option>
              {bays?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {clientId && (
          <div className="mt-3 shrink-0">
            <Field label="Vehículo">
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Sin vehículo</option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} {v.plate && `· ${v.plate}`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <div className="mt-5 flex shrink-0 items-center gap-5 border-b border-slate-200">
          <button
            onClick={() => setTab('service')}
            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-bold transition ${
              tab === 'service' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setTab('product')}
            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-bold transition ${
              tab === 'product' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Productos
          </button>
        </div>

        <div className="relative mt-4 shrink-0">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'service' ? 'Buscar servicio...' : 'Buscar producto...'}
            className="pl-10"
          />
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleItems.map((item) => {
              const outOfStock = tab === 'product' && item.track_inventory && item.stock_qty <= 0
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item.id)}
                  disabled={outOfStock}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-2.5 text-center transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    {item.type === 'service' ? <Droplets size={15} /> : <PackageIcon size={15} />}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-slate-800">{item.name}</span>
                  <span className="text-xs font-bold text-brand-600">{formatMoney(item.price)}</span>
                </button>
              )
            })}
            {visibleItems.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-slate-400">
                {search
                  ? 'Sin resultados para tu búsqueda.'
                  : `Agrega ${tab === 'service' ? 'servicios' : 'productos'} desde "Productos".`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 shrink-0 border-t border-slate-200 pt-3">
          <button
            onClick={() => setRecentOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-bold text-slate-700"
          >
            Ventas recientes
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${recentOpen ? 'rotate-180' : ''}`} />
          </button>
          {recentOpen && (
            <div className="mt-3 max-h-40 overflow-y-auto">
              {!recentSales || recentSales.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no hay ventas.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {recentSales.map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{s.client?.full_name || 'Cliente general'}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(s.sale_date)} · {s.employee?.full_name || 'Sin empleado'}
                        </p>
                      </div>
                      <p className="font-bold">{formatMoney(s.total)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className={`min-h-0 h-full flex-col ${mobileView === 'cart' ? 'flex' : 'hidden'} lg:flex`}>
        <div className="mb-4 flex shrink-0 items-center gap-2">
          <ShoppingCart size={18} className="text-brand-600" />
          <p className="font-bold text-slate-800">Ticket actual</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <EmptyState title="Ticket vacío" description="Selecciona servicios o productos." />
          ) : (
            <div className="grid gap-3">
              {cart.map((it) => (
                <div key={it.item_id} className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{it.item_name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => updateQty(it.item_id, it.qty - 1)}
                      className="grid h-6 w-6 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{it.qty}</span>
                    <button
                      onClick={() => updateQty(it.item_id, it.qty + 1)}
                      className="grid h-6 w-6 place-items-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="w-16 shrink-0 text-right text-sm font-bold">{formatMoney(it.qty * it.unit_price)}</p>
                  <button onClick={() => removeFromCart(it.item_id)} className="shrink-0 text-slate-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <div className="my-4 border-t border-slate-100" />

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Descuento">
                <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Pago">
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> Venta registrada
              </div>
            )}

            <Button disabled={cart.length === 0 || createSale.isPending} onClick={checkout} className="w-full">
              {createSale.isPending ? 'Cobrando...' : 'Cobrar'}
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
}
