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
import { SalesReport } from './pages/reports/SalesReport'
import { ExpensesReport } from './pages/reports/ExpensesReport'
import { AppointmentsReport } from './pages/reports/AppointmentsReport'
import { InventoryReport } from './pages/reports/InventoryReport'
import { CompanySettings } from './pages/CompanySettings'
import { VehicleTypes } from './pages/VehicleTypes'
import { Users } from './pages/Users'
import { Roles } from './pages/Roles'
import type { PermissionKey } from './types/database'

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

function RequirePermission({ permission, children }: { permission: PermissionKey; children: ReactNode }) {
  const { can } = useAuth()
  if (!can(permission)) return <Navigate to="/" replace />
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
          <Route
            path="/pos"
            element={
              <RequirePermission permission="pos">
                <Pos />
              </RequirePermission>
            }
          />
          <Route
            path="/citas"
            element={
              <RequirePermission permission="citas">
                <Appointments />
              </RequirePermission>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequirePermission permission="clientes">
                <Clients />
              </RequirePermission>
            }
          />
          <Route
            path="/catalogo"
            element={
              <RequirePermission permission="catalogo_ver">
                <Catalog />
              </RequirePermission>
            }
          />
          <Route
            path="/compras"
            element={
              <RequirePermission permission="compras">
                <Purchases />
              </RequirePermission>
            }
          />
          <Route
            path="/empleados"
            element={
              <RequirePermission permission="empleados">
                <Employees />
              </RequirePermission>
            }
          />
          <Route
            path="/caja"
            element={
              <RequirePermission permission="caja">
                <CashAndExpenses />
              </RequirePermission>
            }
          />
          <Route
            path="/reportes/ventas"
            element={
              <RequirePermission permission="reportes">
                <SalesReport />
              </RequirePermission>
            }
          />
          <Route
            path="/reportes/gastos"
            element={
              <RequirePermission permission="reportes">
                <ExpensesReport />
              </RequirePermission>
            }
          />
          <Route
            path="/reportes/citas"
            element={
              <RequirePermission permission="reportes">
                <AppointmentsReport />
              </RequirePermission>
            }
          />
          <Route
            path="/reportes/inventario"
            element={
              <RequirePermission permission="reportes">
                <InventoryReport />
              </RequirePermission>
            }
          />
          <Route
            path="/configuracion/empresa"
            element={
              <RequirePermission permission="configuracion">
                <CompanySettings />
              </RequirePermission>
            }
          />
          <Route
            path="/configuracion/tipos-vehiculo"
            element={
              <RequirePermission permission="configuracion">
                <VehicleTypes />
              </RequirePermission>
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
