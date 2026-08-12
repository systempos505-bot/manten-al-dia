import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { useSaveSupplier } from '../../hooks/useSuppliers'

const emptySupplier = { name: '', phone: '', email: '', notes: '' }

export function CreateSupplier() {
  const saveSupplier = useSaveSupplier()
  const [form, setForm] = useState(emptySupplier)
  const [saved, setSaved] = useState(false)

  async function submit() {
    await saveSupplier.mutateAsync({ ...form, active: true })
    setForm(emptySupplier)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Proveedor" description="Registra un nuevo proveedor" />

      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Distribuidora XYZ" required />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Notas">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex items-center gap-3">
            <Button disabled={!form.name || saveSupplier.isPending} onClick={submit}>
              {saveSupplier.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
