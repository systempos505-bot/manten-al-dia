import { useMemo, useState } from 'react'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useExpenses, useCreateExpense, useCashMovements, useCreateCashMovement } from '../hooks/useExpenses'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDate, formatDateTime, todayISODate } from '../lib/format'
import type { PaymentMethod } from '../types/database'

const emptyExpense = { category: 'General', description: '', amount: '0', expense_date: todayISODate(), payment_method: 'efectivo' as PaymentMethod }

export function CashAndExpenses() {
  const formatMoney = useFormatCurrency()
  const [tab, setTab] = useState<'caja' | 'gastos'>('caja')

  const range = useMemo(() => {
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from: from.toISOString(), to: new Date().toISOString() }
  }, [])
  const { data: movements, isLoading: loadingMovements } = useCashMovements(range)
  const createMovement = useCreateCashMovement()
  const [movementOpen, setMovementOpen] = useState(false)
  const [movementForm, setMovementForm] = useState({ type: 'ajuste' as 'apertura' | 'ajuste' | 'cierre', amount: '0', description: '' })

  const { data: expenses, isLoading: loadingExpenses } = useExpenses()
  const createExpense = useCreateExpense()
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState(emptyExpense)

  const balance = (movements ?? []).reduce((sum, m) => {
    if (m.type === 'egreso') return sum - Number(m.amount)
    return sum + Number(m.amount)
  }, 0)

  async function submitMovement() {
    await createMovement.mutateAsync({ type: movementForm.type, amount: Number(movementForm.amount) || 0, description: movementForm.description })
    setMovementOpen(false)
    setMovementForm({ type: 'ajuste', amount: '0', description: '' })
  }

  async function submitExpense() {
    await createExpense.mutateAsync({
      category: expenseForm.category,
      description: expenseForm.description || null,
      amount: Number(expenseForm.amount) || 0,
      expense_date: expenseForm.expense_date,
      payment_method: expenseForm.payment_method,
    })
    setExpenseOpen(false)
    setExpenseForm(emptyExpense)
  }

  return (
    <div>
      <PageHeader
        title="Gastos y caja"
        description="Registro de gastos y libro de movimientos de efectivo (últimos 30 días)"
        action={
          tab === 'caja' ? (
            <Button onClick={() => setMovementOpen(true)}>
              <Plus size={16} /> Movimiento
            </Button>
          ) : (
            <Button onClick={() => setExpenseOpen(true)}>
              <Plus size={16} /> Nuevo gasto
            </Button>
          )
        }
      />

      <div className="mb-5 inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
        <button
          onClick={() => setTab('caja')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'caja' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Caja
        </button>
        <button
          onClick={() => setTab('gastos')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'gastos' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
        >
          Gastos
        </button>
      </div>

      {tab === 'caja' ? (
        <div className="grid gap-4">
          <Card className="bg-gradient-to-br from-slate-900 to-brand-900 text-white">
            <p className="text-sm text-slate-300">Saldo estimado (30 días)</p>
            <p className="mt-1 text-3xl font-extrabold">{formatMoney(balance)}</p>
          </Card>

          <Card className="p-0">
            {loadingMovements ? (
              <Loading />
            ) : !movements || movements.length === 0 ? (
              <EmptyState title="Sin movimientos de caja" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {m.type === 'egreso' ? (
                        <ArrowDownCircle className="text-red-500" size={20} />
                      ) : (
                        <ArrowUpCircle className="text-emerald-500" size={20} />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{m.description || m.type}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(m.movement_date)} · {m.type}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${m.type === 'egreso' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {m.type === 'egreso' ? '-' : '+'}
                      {formatMoney(m.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : (
        <Card className="p-0">
          {loadingExpenses ? (
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
      )}

      <Modal open={movementOpen} title="Movimiento de caja" onClose={() => setMovementOpen(false)}>
        <div className="grid gap-4">
          <Field label="Tipo">
            <Select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as typeof movementForm.type })}>
              <option value="apertura">Apertura de caja</option>
              <option value="ajuste">Ajuste (ingreso manual)</option>
              <option value="cierre">Cierre de caja</option>
            </Select>
          </Field>
          <Field label="Monto">
            <Input type="number" step="0.01" value={movementForm.amount} onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Input value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} />
          </Field>
          <Button disabled={createMovement.isPending} onClick={submitMovement}>
            {createMovement.isPending ? 'Guardando...' : 'Registrar'}
          </Button>
        </div>
      </Modal>

      <Modal open={expenseOpen} title="Nuevo gasto" onClose={() => setExpenseOpen(false)}>
        <div className="grid gap-4">
          <Field label="Categoría">
            <Input value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="Renta, agua, luz, sueldos..." />
          </Field>
          <Field label="Descripción">
            <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto">
              <Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Método de pago">
            <Select value={expenseForm.payment_method} onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value as PaymentMethod })}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <Button disabled={createExpense.isPending} onClick={submitExpense}>
            {createExpense.isPending ? 'Guardando...' : 'Registrar gasto'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
