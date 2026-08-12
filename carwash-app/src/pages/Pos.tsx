import { useMemo, useState } from 'react'
import { Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { useCatalogItems } from '../hooks/useCatalogItems'
import { useClients, useClientVehicles } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useCreateSale, useSales, type SaleDraftItem } from '../hooks/useSales'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDateTime } from '../lib/format'
import type { PaymentMethod } from '../types/database'

export function Pos() {
  const formatMoney = useFormatCurrency()
  const { data: services } = useCatalogItems('service')
  const { data: products } = useCatalogItems('product')
  const { data: clients } = useClients()
  const { data: employees } = useEmployees(true)
  const { data: recentSales } = useSales(8)
  const createSale = useCreateSale()

  const sellableItems = useMemo(
    () => [...(services ?? []), ...(products ?? [])].filter((i) => i.sellable && i.active),
    [services, products],
  )

  const [clientId, setClientId] = useState('')
  const { data: vehicles } = useClientVehicles(clientId || null)
  const [vehicleId, setVehicleId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
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
      payment_method: paymentMethod,
      discount: Number(discount) || 0,
      items,
    })
    setCart([])
    setDiscount('0')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <div>
      <PageHeader title="Punto de venta" description="Registra un servicio o venta y cóbralo al instante" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <Card>
            <p className="mb-3 text-sm font-bold text-slate-700">Servicios</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {services?.filter((s) => s.sellable && s.active).map((s) => (
                <button
                  key={s.id}
                  onClick={() => addToCart(s.id)}
                  className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(s.price)}</p>
                </button>
              ))}
              {(!services || services.filter((s) => s.sellable).length === 0) && (
                <p className="col-span-full text-sm text-slate-400">Agrega servicios en "Productos y servicios".</p>
              )}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-bold text-slate-700">Productos</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {products?.filter((p) => p.sellable && p.active).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  disabled={p.track_inventory && p.stock_qty <= 0}
                  className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(p.price)} {p.track_inventory && `· stock ${p.stock_qty}`}
                  </p>
                </button>
              ))}
              {(!products || products.filter((p) => p.sellable).length === 0) && (
                <p className="col-span-full text-sm text-slate-400">Agrega productos vendibles en "Productos y servicios".</p>
              )}
            </div>
          </Card>

          <Card className="p-0">
            <p className="border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-700">Ventas recientes</p>
            {!recentSales || recentSales.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Aún no hay ventas.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSales.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{s.client?.full_name || 'Cliente general'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.sale_date)} · {s.employee?.full_name || 'Sin empleado'}</p>
                    </div>
                    <p className="font-bold">{formatMoney(s.total)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-600" />
            <p className="font-bold text-slate-800">Ticket actual</p>
          </div>

          <div className="grid gap-3">
            <Field label="Cliente">
              <Select value={clientId} onChange={(e) => { setClientId(e.target.value); setVehicleId('') }}>
                <option value="">Cliente general</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            {clientId && (
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
            )}
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
          </div>

          <div className="my-4 grid gap-2 border-y border-slate-100 py-4">
            {cart.length === 0 ? (
              <EmptyState title="Ticket vacío" description="Selecciona servicios o productos." />
            ) : (
              cart.map((it) => (
                <div key={it.item_id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{it.item_name}</p>
                    <p className="text-xs text-slate-500">{formatMoney(it.unit_price)} c/u</p>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={it.qty}
                    onChange={(e) => updateQty(it.item_id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
                  />
                  <p className="w-20 text-right text-sm font-bold">{formatMoney(it.qty * it.unit_price)}</p>
                  <button onClick={() => removeFromCart(it.item_id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

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
        </Card>
      </div>
    </div>
  )
}
