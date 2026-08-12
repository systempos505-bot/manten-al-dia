-- Mantén al Día · Auto Lavado
-- Migración 012: asignar bahía a una venta desde el Punto de Venta.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

alter table public.sales add column if not exists bay_id uuid references public.bays(id) on delete set null;

create index if not exists idx_sales_bay on public.sales(bay_id);
