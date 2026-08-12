-- Mantén al Día · Auto Lavado
-- Migración 010: proveedores.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

drop policy if exists "members select suppliers" on public.suppliers;
create policy "members select suppliers" on public.suppliers
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write suppliers" on public.suppliers;
create policy "admins write suppliers" on public.suppliers
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update suppliers" on public.suppliers;
create policy "admins update suppliers" on public.suppliers
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete suppliers" on public.suppliers;
create policy "admins delete suppliers" on public.suppliers
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_suppliers_business on public.suppliers(business_id);
