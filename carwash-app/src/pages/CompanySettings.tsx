import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { CURRENCY_OPTIONS } from '../hooks/useCurrency'
import { useUpdateBusiness } from '../hooks/useTeam'
import { supabase } from '../lib/supabase'
import type { DateFormat, TimeFormat } from '../types/database'

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA (31/12/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA (12/31/2026)' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD (2026-12-31)' },
]

const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: '24h', label: '24 horas (14:30)' },
  { value: '12h', label: '12 horas (2:30 PM)' },
]

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4]

export function CompanySettings() {
  const {
    businessId,
    businessName,
    currency,
    secondaryCurrency,
    exchangeRate,
    currencyDecimals,
    quantityDecimals,
    dateFormat,
    timeFormat,
    logoUrl,
    refreshBusiness,
  } = useAuth()
  const updateBusiness = useUpdateBusiness()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(businessName || '')
  const [curr, setCurr] = useState(currency)
  const [secondaryCurr, setSecondaryCurr] = useState(secondaryCurrency || '')
  const [rate, setRate] = useState(String(exchangeRate))
  const [dFormat, setDFormat] = useState<DateFormat>(dateFormat)
  const [tFormat, setTFormat] = useState<TimeFormat>(timeFormat)
  const [currDecimals, setCurrDecimals] = useState(currencyDecimals)
  const [qtyDecimals, setQtyDecimals] = useState(quantityDecimals)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setName(businessName || '')
    setCurr(currency)
    setSecondaryCurr(secondaryCurrency || '')
    setRate(String(exchangeRate))
    setDFormat(dateFormat)
    setTFormat(timeFormat)
    setCurrDecimals(currencyDecimals)
    setQtyDecimals(quantityDecimals)
  }, [businessName, currency, secondaryCurrency, exchangeRate, dateFormat, timeFormat, currencyDecimals, quantityDecimals])

  async function saveBusiness() {
    await updateBusiness.mutateAsync({
      name,
      currency: curr,
      secondary_currency: secondaryCurr || null,
      exchange_rate: Number(rate) || 1,
      date_format: dFormat,
      time_format: tFormat,
      currency_decimals: currDecimals,
      quantity_decimals: qtyDecimals,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !businessId) return
    setUploadError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `${businessId}/logo.${ext}`
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path)
      await updateBusiness.mutateAsync({
        name,
        currency: curr,
        logo_url: `${publicUrlData.publicUrl}?t=${Date.now()}`,
      })
      await refreshBusiness()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir el logotipo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function removeLogo() {
    await updateBusiness.mutateAsync({ name, currency: curr, logo_url: null })
    await refreshBusiness()
  }

  return (
    <div>
      <PageHeader title="Configuración de Empresa" description="Nombre, moneda, formatos y logotipo" />

      <div className="grid gap-6">
        <Card>
          <p className="mb-4 font-bold text-slate-800">Datos del negocio</p>
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
        </Card>

        <Card>
          <p className="mb-4 font-bold text-slate-800">Logotipo</p>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {logoUrl ? (
                <img src={logoUrl} alt="Logotipo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-slate-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar logotipo' : 'Subir logotipo'}
                </Button>
                {logoUrl && (
                  <Button size="sm" variant="secondary" onClick={removeLogo}>
                    <Trash2 size={14} /> Quitar
                  </Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
          </div>
        </Card>

        <Card>
          <p className="mb-1 font-bold text-slate-800">Moneda Secundaria y Tasa de Cambio</p>
          <p className="mb-4 text-sm text-slate-500">
            Para calcular el cambio en el Punto de Venta cuando el cliente paga en otra moneda (ej. dólares).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Moneda secundaria">
              <Select value={secondaryCurr} onChange={(e) => setSecondaryCurr(e.target.value)}>
                <option value="">Ninguna</option>
                {CURRENCY_OPTIONS.filter((c) => c.code !== curr).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Tasa de cambio (1 ${secondaryCurr || '...'} = X ${curr})`}>
              <Input
                type="number"
                step="0.0001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={!secondaryCurr}
                placeholder="Ej. 36.60"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <p className="mb-4 font-bold text-slate-800">Formatos</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Formato de fecha">
              <Select value={dFormat} onChange={(e) => setDFormat(e.target.value as DateFormat)}>
                {DATE_FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Formato de hora">
              <Select value={tFormat} onChange={(e) => setTFormat(e.target.value as TimeFormat)}>
                {TIME_FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Precisión de moneda (decimales)">
              <Select value={String(currDecimals)} onChange={(e) => setCurrDecimals(Number(e.target.value))}>
                {DECIMAL_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} decimales
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Precisión de cantidad (decimales)">
              <Select value={String(qtyDecimals)} onChange={(e) => setQtyDecimals(Number(e.target.value))}>
                {DECIMAL_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} decimales
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={saveBusiness} disabled={updateBusiness.isPending || !name}>
            {updateBusiness.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {saved && <span className="text-sm font-semibold text-emerald-600">Guardado ✓</span>}
        </div>
      </div>
    </div>
  )
}
