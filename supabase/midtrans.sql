-- Jalankan sekali di Supabase SQL Editor sebelum mengaktifkan Midtrans.
alter table public.orders drop constraint if exists orders_wallet_check;
alter table public.orders add constraint orders_wallet_check check (wallet in ('DANA','OVO','GoPay','MIDTRANS'));
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists payment_status text;
alter table public.orders add column if not exists payment_payload jsonb;