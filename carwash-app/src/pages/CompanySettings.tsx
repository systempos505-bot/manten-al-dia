import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { CURRENCY_OPTIONS } from '../hooks/useCurrency'
import { useUpdateBusiness } from '../hooks/useTeam'

export function CompanySettings() {
  const { businessName, currency } = useAuth()
  const updateBusiness = useUpdateBusiness()

  const [name, setName] = useState(businessName || '')
  const [curr, setCurr] = useState(currency)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(businessName || '')
    setCurr(currency)
  }, [businessName, currency])

  async function saveBusiness() {
    await updateBusiness.mutateAsync({ name, currency: curr })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Configuración de Empresa" description="Nombre del negocio y moneda" />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Moneda">
            <Select value={curr} onChange={(e) => setCurr(e.target.value)}>
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveBusiness} disabled={updateBusiness.isPending || !name}>
            {updateBusiness.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
        </div>
      </Card>
    </div>
  )
}
