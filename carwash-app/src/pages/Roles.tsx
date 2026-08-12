import { Check, X } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'

const PERMISSION_ROWS: { label: string; admin: boolean; staff: boolean }[] = [
  { label: 'Punto de venta', admin: true, staff: true },
  { label: 'Citas', admin: true, staff: true },
  { label: 'Clientes', admin: true, staff: true },
  { label: 'Ver catálogo (productos y servicios)', admin: true, staff: true },
  { label: 'Editar precios y catálogo', admin: true, staff: false },
  { label: 'Compras', admin: true, staff: false },
  { label: 'Empleados', admin: true, staff: false },
  { label: 'Gastos y caja', admin: true, staff: false },
  { label: 'Reportes', admin: true, staff: false },
  { label: 'Configuración y usuarios', admin: true, staff: false },
]

function PermCell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check size={16} className="mx-auto text-emerald-600" />
  ) : (
    <X size={16} className="mx-auto text-slate-300" />
  )
}

export function Roles() {
  return (
    <div>
      <PageHeader
        title="Roles"
        description="Estos son los permisos de cada rol. Se asignan a cada usuario desde 'Crear usuario'."
      />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Puede usar...</th>
                <th className="px-5 py-3 text-center">Administrador</th>
                <th className="px-5 py-3 text-center">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSION_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="px-5 py-2.5 text-slate-700">{row.label}</td>
                  <td className="px-5 py-2.5 text-center">
                    <PermCell allowed={row.admin} />
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <PermCell allowed={row.staff} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
