import { useMemo, useState } from 'react'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useCashMovements, useCreateCashMovement } from '../hooks/useExpenses'
import { useFormatCurrency } from '../hooks/useCurrency'
import { formatDateTime } from '../lib/format'

export function Cash() {
  const formatMoney = useFormatCurrency()

  const range = useMemo(() => {
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from: from.toISOString(), to: new Date().toISOString() }
  }, [])
  const { data: movements, isLoading: loadingMovements } = useCashMovements(range)
  const createMovement = useCreateCashMovement()
  const [movementOpen, setMovementOpen] = useState(false)
  const [movementForm, setMovementForm] = useState({ type: 'ajuste' as 'apertura' | 'ajuste' | 'cierre', amount: '0', description: '' })

  const balance = (movements ?? []).reduce((sum, m) => {
    if (m.type === 'egreso') return sum - Number(m.amount)
    return sum + Number(m.amount)
  }, 0)

  async function submitMovement() {
    await createMovement.mutateAsync({ type: movementForm.type, amount: Number(movementForm.amount) || 0, description: movementForm.description })
    setMovementOpen(false)
    setMovementForm({ type: 'ajuste', amount: '0', description: '' })
  }

  return (
    <div>
      <PageHeader
        title="Caja"
        description="Libro de movimientos de efectivo (últimos 30 días)"
        action={
          <Button onClick={() => setMovementOpen(true)}>
            <Plus size={16} /> Movimiento
          </Button>
        }
      />

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
    </div>
  )
}
