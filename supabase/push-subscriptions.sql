-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Subscription dibuat dan dibaca hanya oleh Netlify Functions menggunakan service role key.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  subscription jsonb not null,
  recipient_type text not null check (recipient_type in ('admin', 'buyer')),
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Tidak ada policy publik. Browser tidak bisa membaca subscription perangkat lain.