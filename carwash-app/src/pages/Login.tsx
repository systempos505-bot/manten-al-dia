import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { isSupabaseConfigured } from '../lib/supabase'

export function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    const result =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password, businessName)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (mode === 'signup') {
      setInfo('Cuenta creada. Si tu proyecto de Supabase pide confirmación por correo, revisa tu bandeja antes de iniciar sesión.')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">🚿</div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Auto Lavado</h1>
            <p className="text-sm text-slate-500">Administra tu negocio de lavado de autos</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Falta configurar Supabase. Copia <code>.env.example</code> a <code>.env</code> y agrega tus credenciales.
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            className={`rounded-lg py-2 text-sm font-bold transition ${mode === 'signin' ? 'bg-white shadow' : 'text-slate-500'}`}
            onClick={() => setMode('signin')}
            type="button"
          >
            Iniciar sesión
          </button>
          <button
            className={`rounded-lg py-2 text-sm font-bold transition ${mode === 'signup' ? 'bg-white shadow' : 'text-slate-500'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === 'signup' && (
            <Field label="Nombre del negocio">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Auto Lavado El Brillo"
                required
              />
            </Field>
          )}
          <Field label="Correo electrónico">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </Field>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Espera...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
