import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarClock,
  Users,
  Package,
  Truck,
  UserRound,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { PermissionKey } from '../../types/database'

const links: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; permission: PermissionKey | null }[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true, permission: null },
  { to: '/pos', label: 'Punto de venta', icon: ShoppingCart, permission: 'pos' },
  { to: '/citas', label: 'Citas', icon: CalendarClock, permission: 'citas' },
  { to: '/clientes', label: 'Clientes', icon: Users, permission: 'clientes' },
  { to: '/catalogo', label: 'Productos y servicios', icon: Package, permission: 'catalogo_ver' },
  { to: '/compras', label: 'Compras', icon: Truck, permission: 'compras' },
  { to: '/empleados', label: 'Empleados', icon: UserRound, permission: 'empleados' },
  { to: '/caja', label: 'Gastos y caja', icon: Wallet, permission: 'caja' },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, permission: 'reportes' },
]

const userGroupLinks = [
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/usuarios/roles', label: 'Roles' },
]

const configGroupLinks = [
  { to: '/configuracion/empresa', label: 'Configuración de Empresa' },
  { to: '/configuracion/tipos-vehiculo', label: 'Tipos de Vehículo' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { businessName, user, isAdmin, can, signOut, logoUrl } = useAuth()
  const location = useLocation()
  const visibleLinks = links.filter((link) => link.permission === null || can(link.permission))
  const canConfig = can('configuracion')

  const userGroupActive = location.pathname.startsWith('/usuarios')
  const [userGroupOpen, setUserGroupOpen] = useState(userGroupActive)

  const configGroupActive = location.pathname.startsWith('/configuracion')
  const [configGroupOpen, setConfigGroupOpen] = useState(configGroupActive)

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col gap-6 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 p-5 text-white transition-transform duration-200 ease-out md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 text-2xl">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : '🚿'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">{businessName || 'Auto Lavado'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="grid gap-1">
          {visibleLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {canConfig && (
            <div>
              <button
                onClick={() => setConfigGroupOpen((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  configGroupActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <SettingsIcon size={18} />
                <span className="flex-1 text-left">Configuración</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-150 ${configGroupOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {configGroupOpen && (
                <div className="ml-4 mt-1 grid gap-1 border-l border-white/10 pl-3">
                  {configGroupLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      onClick={onClose}
                      className={({ isActive }) =>
                        `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                          isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <div>
              <button
                onClick={() => setUserGroupOpen((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  userGroupActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShieldCheck size={18} />
                <span className="flex-1 text-left">Gestión de usuarios</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-150 ${userGroupOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userGroupOpen && (
                <div className="ml-4 mt-1 grid gap-1 border-l border-white/10 pl-3">
                  {userGroupLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      onClick={onClose}
                      className={({ isActive }) =>
                        `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                          isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <button
          onClick={() => signOut()}
          className="mt-auto flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>
    </>
  )
}
