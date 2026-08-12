-- Mantén al Día · Auto Lavado
-- Migración 008: formato de fecha/hora, logotipo, y precisión de moneda y
-- cantidad, configurables por negocio.
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query.

alter table public.businesses add column if not exists date_format text not null default 'DD/MM/YYYY';
alter table public.businesses add column if not exists time_format text not null default '24h';
alter table public.businesses add column if not exists logo_url text;
alter table public.businesses add column if not exists currency_decimals integer not null default 2;
alter table public.businesses add column if not exists quantity_decimals integer not null default 2;

alter table public.businesses drop constraint if exists businesses_date_format_check;
alter table public.businesses add constraint businesses_date_format_check
  check (date_format in ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));

alter table public.businesses drop constraint if exists businesses_time_format_check;
alter table public.businesses add constraint businesses_time_format_check
  check (time_format in ('24h', '12h'));

-- =========================================================
-- Storage: bucket público para logotipos de negocio.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "public read logos" on storage.objects;
create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "admins upload logos" on storage.objects;
create policy "admins upload logos" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "admins update logos" on storage.objects;
create policy "admins update logos" on storage.objects
  for update using (
    bucket_id = 'logos'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "admins delete logos" on storage.objects;
create policy "admins delete logos" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );
