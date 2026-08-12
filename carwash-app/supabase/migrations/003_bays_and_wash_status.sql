-- Mantén al Día · Auto Lavado
-- Migración 003: bahías (estaciones de lavado) + estados de lavado más
-- detallados (en espera / lavando / listo / entregado).
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

-- =========================================================
-- Bahías: las estaciones físicas donde se lavan los vehículos.
-- =========================================================
create table if not exists public.bays (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bays enable row level security;

drop policy if exists "members select bays" on public.bays;
create policy "members select bays" on public.bays
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write bays" on public.bays;
create policy "admins write bays" on public.bays
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update bays" on public.bays;
create policy "admins update bays" on public.bays
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete bays" on public.bays;
create policy "admins delete bays" on public.bays
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_bays_business on public.bays(business_id);

-- =========================================================
-- Citas / lavados: se les puede asignar una bahía, y el estado ahora
-- distingue "en espera" (llegó, esperando turno) y "listo" (ya terminó,
-- esperando que lo recojan) además de los estados existentes.
-- =========================================================
alter table public.appointments add column if not exists bay_id uuid references public.bays(id) on delete set null;

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('pendiente', 'confirmada', 'en_espera', 'en_proceso', 'listo', 'completada', 'cancelada'));

create index if not exists idx_appointments_bay on public.appointments(bay_id);
