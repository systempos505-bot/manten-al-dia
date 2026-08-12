import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { useCreateExpense } from '../../hooks/useExpenses'
import { todayISODate } from '../../lib/format'
import type { PaymentMethod } from '../../types/database'

const emptyExpense = { category: 'General', description: '', amount: '0', expense_date: todayISODate(), payment_method: 'efectivo' as PaymentMethod }

export function CreateExpense() {
  const createExpense = useCreateExpense()
  const [expenseForm, setExpenseForm] = useState(emptyExpense)
  const [saved, setSaved] = useState(false)

  async function submitExpense() {
    await createExpense.mutateAsync({
      category: expenseForm.category,
      description: expenseForm.description || null,
      amount: Number(expenseForm.amount) || 0,
      expense_date: expenseForm.expense_date,
      payment_method: expenseForm.payment_method,
    })
    setExpenseForm(emptyExpense)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Gasto" description="Registra un nuevo gasto del negocio" />

      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Categoría">
            <Input
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              placeholder="Renta, agua, luz, sueldos..."
            />
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
          <div className="flex items-center gap-3">
            <Button disabled={createExpense.isPending} onClick={submitExpense}>
              {createExpense.isPending ? 'Guardando...' : 'Registrar gasto'}
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
