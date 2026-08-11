import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export function SetupNeeded() {
  const { refreshBusiness, signOut } = useAuth()

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-3xl">⚠️</div>
        <h1 className="text-lg font-extrabold text-slate-900">Falta terminar la configuración</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu cuenta se creó, pero no encontramos un negocio asociado. Asegúrate de haber ejecutado el archivo{' '}
          <code>supabase/schema.sql</code> completo en el editor SQL de tu proyecto Supabase (ese script crea el
          trigger que da de alta tu negocio automáticamente al registrarte).
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
          <Button onClick={() => refreshBusiness()}>Reintentar</Button>
        </div>
      </div>
    </div>
  )
}
