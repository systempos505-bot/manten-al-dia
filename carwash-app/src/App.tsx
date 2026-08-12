import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Loading } from './components/ui/Loading'
import { AppShell } from './components/layout/AppShell'
import { Login } from './pages/Login'
import { SetupNeeded } from './pages/SetupNeeded'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { Catalog } from './pages/Catalog'
import { Purchases } from './pages/Purchases'
import { Appointments } from './pages/Appointments'
import { Employees } from './pages/Employees'
import { Pos } from './pages/Pos'
import { CashAndExpenses } from './pages/CashAndExpenses'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Users } from './pages/Users'
import { Roles } from './pages/Roles'

function Protected() {
  const { session, loading, businessId } = useAuth()

  if (loading) return <Loading label="Cargando tu cuenta..." />
  if (!session) return <Navigate to="/login" replace />
  if (!businessId) return <SetupNeeded />

  return <AppShell />
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Loading label="Cargando..." />
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route element={<Protected />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/citas" element={<Appointments />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route
            path="/compras"
            element={
              <RequireAdmin>
                <Purchases />
              </RequireAdmin>
            }
          />
          <Route
            path="/empleados"
            element={
              <RequireAdmin>
                <Employees />
              </RequireAdmin>
            }
          />
          <Route
            path="/caja"
            element={
              <RequireAdmin>
                <CashAndExpenses />
              </RequireAdmin>
            }
          />
          <Route
            path="/reportes"
            element={
              <RequireAdmin>
                <Reports />
              </RequireAdmin>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RequireAdmin>
                <Settings />
              </RequireAdmin>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RequireAdmin>
                <Users />
              </RequireAdmin>
            }
          />
          <Route
            path="/usuarios/roles"
            element={
              <RequireAdmin>
                <Roles />
              </RequireAdmin>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
