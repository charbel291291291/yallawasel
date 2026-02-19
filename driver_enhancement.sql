-- =============================================
-- DRIVER PWA ENHANCEMENTS MIGRATION
-- =============================================

-- 1. Enhance Profiles for Driver Details
alter table public.profiles add column if not exists vehicle_type text; -- 'bike', 'car', 'van'
alter table public.profiles add column if not exists vehicle_plate text;
alter table public.profiles add column if not exists is_online boolean default false;
alter table public.profiles add column if not exists driver_status text default 'offline'; -- 'online', 'busy', 'offline'
alter table public.profiles add column if not exists rating numeric default 5.0;
alter table public.profiles add column if not exists total_deliveries integer default 0;
alter table public.profiles add column if not exists acceptance_rate numeric default 100.0;

-- 2. Enhance Orders for Delivery Proof & Workflow
alter table public.orders add column if not exists delivery_proof_url text;
alter table public.orders add column if not exists customer_signature_url text;
alter table public.orders add column if not exists driver_feedback text;
alter table public.orders add column if not exists driver_accepted_at timestamp with time zone;
alter table public.orders add column if not exists driver_arrived_at timestamp with time zone;
alter table public.orders add column if not exists driver_picked_up_at timestamp with time zone;

-- 3. Driver Transactions (Earnings)
create table if not exists public.driver_transactions (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  order_id uuid references public.orders(id),
  amount numeric not null,
  type text not null, -- 'commission', 'tip', 'payout', 'adjustment'
  description text,
  created_at timestamp with time zone default now()
);

-- 4. Driver Achievements / Badges
create table if not exists public.driver_achievements (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  badge_code text not null, -- 'fast_driver', 'top_performer_week'
  earned_at timestamp with time zone default now(),
  constraint unique_driver_badge unique (driver_id, badge_code)
);

-- 5. Driver Daily Stats (for Goals/Performance)
create table if not exists public.driver_daily_stats (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  date date not null default CURRENT_DATE,
  deliveries_count integer default 0,
  earnings numeric default 0,
  online_hours numeric default 0,
  distance_km numeric default 0,
  unique(driver_id, date)
);

-- RLS POLICIES

-- Driver Transactions
alter table public.driver_transactions enable row level security;
create policy "Drivers Read Own Transactions" on public.driver_transactions for select using (auth.uid() = driver_id);
create policy "Admin Manage Driver Transactions" on public.driver_transactions for all using (true);

-- Driver Achievements
alter table public.driver_achievements enable row level security;
create policy "Drivers Read Own Achievements" on public.driver_achievements for select using (auth.uid() = driver_id);
create policy "Admin Manage Driver Achievements" on public.driver_achievements for all using (true);

-- Driver Daily Stats
alter table public.driver_daily_stats enable row level security;
create policy "Drivers Read Own Daily Stats" on public.driver_daily_stats for select using (auth.uid() = driver_id);
create policy "Admin Manage Driver Daily Stats" on public.driver_daily_stats for all using (true);

-- Update Profiles properties
create policy "Drivers Update Own Status" on public.profiles for update using (auth.uid() = id);
