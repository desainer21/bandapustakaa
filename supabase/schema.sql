-- Jalankan sekali di Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price integer not null check (price >= 0),
  description text not null,
  cover_url text,
  file_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('BP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  buyer_name text not null,
  buyer_email text,
  wallet text not null check (wallet in ('DANA','OVO','GoPay')),
  total integer not null check (total >= 0),
  proof_path text,
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price integer not null,
  primary key(order_id, product_id)
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Pengunjung hanya boleh membaca produk aktif. Admin ditentukan dari app_metadata.role
-- (setelah membuat akun di Authentication, atur role=admin melalui Dashboard/admin API).
create policy "catalog is public" on public.products for select using (is_active = true);
create policy "admins manage products" on public.products for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins read orders" on public.orders for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins update orders" on public.orders for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins read order items" on public.order_items for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Buat bucket PRIVATE bernama digital-files dan payment-proofs di Storage Dashboard.
-- Buat bucket PUBLIC bernama covers untuk gambar sampul. Atur hanya admin yang dapat mengunggah.
insert into storage.buckets (id, name, public) values ('covers','covers',true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('digital-files','digital-files',false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('payment-proofs','payment-proofs',false) on conflict do nothing;
create policy "admin manages covers" on storage.objects for all to authenticated using (
 bucket_id = 'covers' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
) with check (bucket_id = 'covers' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
