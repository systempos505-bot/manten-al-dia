import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isPos = location.pathname === '/pos'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="flex items-center gap-2 font-bold text-slate-900">🚿 Auto Lavado</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className={isPos ? 'h-full p-4 md:p-6' : 'mx-auto max-w-6xl p-6 md:p-8'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
