# Auto Lavado · Administración

Software de administración para un negocio de auto lavado: punto de venta,
citas, clientes y vehículos, empleados y turnos, productos/servicios con
inventario, compras, gastos, caja y reportes.

Una sola base de código para **Web** y **Escritorio (Windows/Mac/Linux)**,
con **Supabase** (Postgres) como backend en la nube.

## Stack

- React + TypeScript + Vite + Tailwind CSS
- React Router, TanStack Query, Recharts
- Supabase (Postgres, Auth, Row Level Security)
- Electron + electron-builder para empaquetar la app de escritorio

## 1. Configurar Supabase (una sola vez)

1. Crea una cuenta gratis en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. Ve a **SQL Editor > New query**, pega **todo** el contenido de
   [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo. Esto crea las
   tablas, los triggers de negocio (ventas → caja, compras → gastos → caja,
   control de inventario) y las políticas de seguridad (RLS).
2.b. Si ya tenías el proyecto creado desde antes, ve otra vez a **SQL Editor
   > New query** y ejecuta también cada archivo dentro de
   [`supabase/migrations/`](./supabase/migrations) en orden (por ahora solo
   `002_roles_and_permissions.sql`). Ahí se agregan los usuarios con roles y
   permisos (administrador / operador) e invitaciones por código.
3. Ve a **Project Settings > API** y copia el **Project URL** y la
   **anon public key**.
4. En este proyecto, copia `.env.example` a `.env` y pega tus credenciales:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

5. Si tu proyecto de Supabase tiene activada la confirmación por correo,
   revisa la bandeja de entrada del correo con el que te registres en la app
   antes de poder iniciar sesión.

Al registrar el primer usuario, se crea automáticamente un **negocio** y
queda como administrador. Todo lo que captures (clientes, ventas, citas,
etc.) queda aislado a tu negocio mediante Row Level Security.

## 2. Instalar y correr en desarrollo

```bash
npm install
npm run dev          # abre http://localhost:5173 (web)
npm run electron:dev # abre la app en una ventana de escritorio
```

## 3. Compilar para producción

```bash
npm run build                # build web (carpeta dist/)
npm run electron:build       # instalador para tu plataforma actual
npm run electron:build:win   # instalador Windows (.exe / NSIS)
npm run electron:build:mac   # instalador macOS (.dmg)
npm run electron:build:linux # AppImage Linux
```

Los instaladores quedan en `release/`. Para compilar el instalador de
Windows/macOS normalmente necesitas correr ese comando en esa misma
plataforma (o usar un runner de CI para esa plataforma).

## Estructura del proyecto

```
carwash-app/
  electron/           Proceso principal de Electron (ventana de escritorio)
  supabase/schema.sql Esquema completo de base de datos (ejecutar en Supabase)
  src/
    context/          Autenticación y negocio activo
    hooks/             Acceso a datos (React Query + Supabase) por módulo
    components/        UI reutilizable (botones, tarjetas, modales, layout)
    pages/              Pantallas: Dashboard, POS, Citas, Clientes,
                         Catálogo, Compras, Empleados, Caja/Gastos, Reportes
```

## Módulos incluidos

- **Punto de venta (POS)**: arma un ticket con servicios/productos, cobra y
  registra el ingreso en caja automáticamente.
- **Citas**: agenda por cliente, vehículo, servicio y empleado.
- **Clientes y vehículos**: historial por cliente.
- **Productos y servicios**: catálogo con precio, costo y control de
  inventario opcional (con alerta de stock bajo).
- **Compras**: reabastece inventario y genera el gasto correspondiente.
- **Empleados y turnos**: roster, comisión por venta, entrada/salida.
- **Gastos y caja**: registro de gastos por categoría y libro de movimientos
  de efectivo (ingresos/egresos).
- **Reportes**: ventas por día, por empleado, artículos más vendidos y
  gastos por categoría, por rango de fechas.
- **Moneda configurable**: en Configuración se elige la moneda del negocio
  (MXN, USD, y varias más de Latinoamérica y otras regiones); todos los
  montos de la app se muestran en esa moneda.
- **Usuarios, roles y permisos**: además de ti como administrador, puedes
  invitar a alguien más (por ejemplo un cajero) generando un código desde
  Configuración. Esa persona crea su propia cuenta y se une a tu negocio con
  el rol que le asignes:
  - **Administrador**: acceso total (igual que tú).
  - **Operador**: solo Punto de venta, Citas, Clientes y ver el catálogo
    (sin poder editar precios, ver reportes, gastos ni configuración).
  Los permisos están reforzados también a nivel de base de datos (no solo
  ocultos en pantalla), así que un operador no puede saltarse la
  restricción aunque intente entrar directo a una URL.

## Notas y siguientes pasos

- El módulo de "caja" implementado es un **libro de movimientos de
  efectivo** (ingresos/egresos con saldo estimado). Si más adelante
  necesitas cuentas por cobrar (fiado a clientes) o múltiples cajas por
  sucursal, es una extensión natural del esquema actual.
- Cancelar una venta no revierte automáticamente el stock descontado; es una
  mejora pendiente si la necesitas.
- La app de escritorio no se pudo probar visualmente en este entorno (sin
  entorno gráfico), pero el binario de Electron y el empaquetado con
  electron-builder quedaron configurados y verificados (`electron --version`
  corre correctamente). Pruébala en tu máquina con `npm run electron:dev`.
