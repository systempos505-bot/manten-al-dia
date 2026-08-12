-- Mantén al Día · Auto Lavado
-- Migración 011: unidades y categorías configurables para productos.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

-- =========================================================
-- Unidades (pza, kg, lt, caja...)
-- =========================================================
create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_units enable row level security;

drop policy if exists "members select product_units" on public.product_units;
create policy "members select product_units" on public.product_units
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write product_units" on public.product_units;
create policy "admins write product_units" on public.product_units
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update product_units" on public.product_units;
create policy "admins update product_units" on public.product_units
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete product_units" on public.product_units;
create policy "admins delete product_units" on public.product_units
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_product_units_business on public.product_units(business_id);

-- =========================================================
-- Categorías de productos y servicios
-- =========================================================
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;

drop policy if exists "members select product_categories" on public.product_categories;
create policy "members select product_categories" on public.product_categories
  for select using (business_id in (select public.current_business_ids()));

drop policy if exists "admins write product_categories" on public.product_categories;
create policy "admins write product_categories" on public.product_categories
  for insert with check (public.is_business_admin(business_id));

drop policy if exists "admins update product_categories" on public.product_categories;
create policy "admins update product_categories" on public.product_categories
  for update using (public.is_business_admin(business_id));

drop policy if exists "admins delete product_categories" on public.product_categories;
create policy "admins delete product_categories" on public.product_categories
  for delete using (public.is_business_admin(business_id));

create index if not exists idx_product_categories_business on public.product_categories(business_id);

-- =========================================================
-- Vincular catálogo con categoría (opcional).
-- =========================================================
alter table public.catalog_items add column if not exists category_id uuid references public.product_categories(id) on delete set null;

-- =========================================================
-- Trigger: al crear un negocio, sembrar unidades y categorías por defecto.
-- =========================================================
create or replace function public.create_default_product_units_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_units (business_id, name, sort_order, active)
  values
    (new.id, 'Pieza', 0, true),
    (new.id, 'Kilogramo', 1, true),
    (new.id, 'Litro', 2, true),
    (new.id, 'Caja', 3, true);

  insert into public.product_categories (business_id, name, sort_order, active)
  values
    (new.id, 'General', 0, true);

  return new;
end;
$$;

drop trigger if exists on_business_created_add_product_units_categories on public.businesses;
create trigger on_business_created_add_product_units_categories
  after insert on public.businesses
  for each row
  execute function public.create_default_product_units_categories();

-- Para negocios que ya existen: sembrar valores por defecto si aún no los tienen.
insert into public.product_units (business_id, name, sort_order, active)
select id, 'Pieza', 0, true from public.businesses
where not exists (select 1 from public.product_units where business_id = public.businesses.id)
on conflict do nothing;

insert into public.product_categories (business_id, name, sort_order, active)
select id, 'General', 0, true from public.businesses
where not exists (select 1 from public.product_categories where business_id = public.businesses.id)
on conflict do nothing;
