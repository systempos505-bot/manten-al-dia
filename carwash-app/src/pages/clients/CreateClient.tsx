import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { useSaveClient } from '../../hooks/useClients'

const emptyClient = { full_name: '', phone: '', email: '', notes: '' }

export function CreateClient() {
  const saveClient = useSaveClient()
  const [form, setForm] = useState(emptyClient)
  const [saved, setSaved] = useState(false)

  async function submit() {
    await saveClient.mutateAsync(form)
    setForm(emptyClient)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Crear Cliente" description="Registra un nuevo cliente" />

      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Nombre completo">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
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
            <Button disabled={!form.full_name || saveClient.isPending} onClick={submit}>
              {saveClient.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </Card>
    </div>
  )
}
