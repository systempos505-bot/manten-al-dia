import { NavLink } from 'react-router-dom'
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
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'Punto de venta', icon: ShoppingCart },
  { to: '/citas', label: 'Citas', icon: CalendarClock },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Productos y servicios', icon: Package },
  { to: '/compras', label: 'Compras', icon: Truck },
  { to: '/empleados', label: 'Empleados', icon: UserRound },
  { to: '/caja', label: 'Gastos y caja', icon: Wallet },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { businessName, user, signOut } = useAuth()

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
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">🚿</div>
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
          {links.map(({ to, label, icon: Icon, end }) => (
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
