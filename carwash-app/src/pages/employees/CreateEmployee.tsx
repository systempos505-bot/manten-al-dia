import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { useSaveEmployee } from '../../hooks/useEmployees'

const emptyForm = { full_name: '', phone: '', role: 'lavador', commission_pct: '0', active: true }

export function CreateEmployee() {
  const saveEmployee = useSaveEmployee()
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)

  async function submit() {
    await saveEmployee.mutateAsync({
      full_name: form.full_name,
      phone: form.phone || null,
      role: form.role,
      commission_pct: Number(form.commission_pct) || 0,
      active: form.active,
    })
    setForm(emptyForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Empleado" description="Registra un nuevo integrante de tu equipo" />

      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Nombre completo">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rol">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="lavador, cajero, gerente" />
            </Field>
            <Field label="Comisión (%)">
              <Input type="number" step="0.1" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            Activo
          </label>
          <div className="flex items-center gap-3">
            <Button disabled={!form.full_name || saveEmployee.isPending} onClick={submit}>
              {saveEmployee.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
