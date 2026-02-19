-- =============================================
-- DRIVER PWA V2 ARCHITECTURE SCHEMA
-- =============================================

-- 1. DRIVERS PROFILES (Extends auth.users)
-- "Drivers Table" requirement mapping
alter table public.profiles add column if not exists vehicle_number text;
alter table public.profiles add column if not exists driver_status text default 'offline'; -- active/offline/busy
alter table public.profiles add column if not exists total_deliveries integer default 0;
alter table public.profiles add column if not exists rating numeric default 5.0;
-- name, phone, created_at already exist in profiles

-- 2. DRIVER LOCATION
create table if not exists public.driver_locations (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null unique,
  latitude numeric not null,
  longitude numeric not null,
  last_updated timestamp with time zone default now()
);

-- 3. DRIVER EARNINGS (Transactions)
create table if not exists public.driver_earnings (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  order_id uuid references public.orders(id),
  amount numeric not null,
  commission numeric default 0,
  payment_type text, -- 'cash', 'transfer', 'wallet'
  created_at timestamp with time zone default now()
);

-- 4. DRIVER WALLET
create table if not exists public.driver_wallets (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null unique,
  balance numeric default 0.00,
  pending_withdrawal numeric default 0.00,
  updated_at timestamp with time zone default now()
);

-- 5. DRIVER ACHIEVEMENTS / GAMIFICATION
create table if not exists public.driver_achievements (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  badge_name text not null,
  milestone_reached text,
  achieved_at timestamp with time zone default now(),
  constraint unique_driver_badge_v2 unique (driver_id, badge_name)
);

-- 6. DRIVER GOALS (Daily Targets)
create table if not exists public.driver_goals (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  date date default CURRENT_DATE,
  target_deliveries integer default 10,
  current_deliveries integer default 0,
  target_earnings numeric default 100.00,
  current_earnings numeric default 0.00,
  unique(driver_id, date)
);

-- INDEXES for Optimization
create index if not exists idx_driver_locations_driver_id on public.driver_locations(driver_id);
create index if not exists idx_driver_earnings_driver_id on public.driver_earnings(driver_id);
create index if not exists idx_driver_earnings_created_at on public.driver_earnings(created_at);
create index if not exists idx_orders_driver_id_status on public.orders(driver_id, status);

-- RLS POLICIES
alter table public.driver_wallets enable row level security;
create policy "Drivers view own wallet" on public.driver_wallets for select using (auth.uid() = driver_id);

alter table public.driver_goals enable row level security;
create policy "Drivers view own goals" on public.driver_goals for select using (auth.uid() = driver_id);
create policy "Drivers update own goals" on public.driver_goals for update using (auth.uid() = driver_id);

-- TRIGGER to auto-create wallet and goals for new drivers
create or replace function public.handle_new_driver()
returns trigger as $$
begin
  if new.role = 'driver' then
    insert into public.driver_wallets (driver_id) values (new.id) on conflict do nothing;
    insert into public.driver_goals (driver_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_driver_created
  after insert or update on public.profiles
  for each row execute procedure public.handle_new_driver();
