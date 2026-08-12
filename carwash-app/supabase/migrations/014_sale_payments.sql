-- Mantén al Día · Auto Lavado
-- Migración 014: pago múltiple (mixto) en el Punto de Venta.
-- Permite dividir el cobro de una venta en varios métodos y/o monedas
-- (ej. una parte en efectivo en Córdoba y otra en tarjeta o en dólares).
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('efectivo','tarjeta','transferencia','otro','multiple'));

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method text not null check (method in ('efectivo','tarjeta','transferencia','otro')),
  currency text not null,
  amount numeric(12,2) not null,
  amount_main numeric(12,2) not null,
  created_at timestamptz not null default now()
);

alter table public.sale_payments enable row level security;

drop policy if exists "members all sale_payments" on public.sale_payments;
create policy "members all sale_payments" on public.sale_payments
  for all using (sale_id in (select id from public.sales where business_id in (select public.current_business_ids())))
  with check (sale_id in (select id from public.sales where business_id in (select public.current_business_ids())));

create index if not exists idx_sale_payments_sale on public.sale_payments(sale_id);
