
-- ========================================================
-- YALLA WASEL - PRODUCTION DATABASE SCHEMA (V3)
-- Unified, Hardened, and Optimized
-- ========================================================

-- --------------------------------------------------------
-- 0. CORE EXTENSIONS & HELPERS
-- --------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Helper to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and (is_admin = true or role = 'admin')
  );
end;
$$ language plpgsql security definer;

-- Helper to check if user is driver
create or replace function public.is_driver()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'driver'
  );
end;
$$ language plpgsql security definer;

-- --------------------------------------------------------
-- 1. PROFILES (Core User Data)
-- --------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  wallet_balance numeric default 0 check (wallet_balance >= 0),
  points integer default 0 check (points >= 0),
  tier text default 'Bronze',
  role text default 'customer' check (role in ('customer', 'admin', 'driver')),
  is_admin boolean default false,
  
  -- Driver Specific Fields
  vehicle_type text check (vehicle_type in ('bike', 'car', 'van')),
  vehicle_plate text,
  is_online boolean default false,
  driver_status text default 'offline' check (driver_status in ('online', 'busy', 'offline')),
  rating numeric default 5.0 check (rating >= 0 and rating <= 5.0),
  total_deliveries integer default 0 check (total_deliveries >= 0),
  acceptance_rate numeric default 100.0 check (acceptance_rate >= 0 and acceptance_rate <= 100.0),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- --------------------------------------------------------
-- 2. PRODUCTS
-- --------------------------------------------------------
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  price numeric not null check (price >= 0),
  cost numeric default 0 check (cost >= 0),
  stock integer default 0 check (stock >= 0),
  category text,
  image text,
  tags text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 3. ORDERS & TRACKING
-- --------------------------------------------------------
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  driver_id uuid references auth.users,
  full_name text not null,
  phone text not null,
  address text not null,
  total numeric not null check (total >= 0),
  delivery_fee numeric default 0 check (delivery_fee >= 0),
  status text default 'pending', -- pending, approved, preparing, out_for_delivery, delivered, cancelled
  payment_method text check (payment_method in ('cash', 'wallet', 'card')),
  delivery_zone text,
  items jsonb not null, -- Array of OrderItems
  notes text,
  admin_notes text,
  
  -- Driver Tracking
  delivery_proof_url text,
  customer_signature_url text,
  driver_feedback text,
  driver_accepted_at timestamp with time zone,
  driver_arrived_at timestamp with time zone,
  driver_picked_up_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.order_status_history (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null,
  note text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default now()
);

-- --------------------------------------------------------
-- 4. DRIVER OPERATIONS (CONSOLIDATED)
-- --------------------------------------------------------
create table if not exists public.driver_locations (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) on delete cascade not null unique,
  latitude numeric not null,
  longitude numeric not null,
  last_updated timestamp with time zone default now()
);

create table if not exists public.driver_transactions (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric not null,
  type text not null, -- commission, tip, payout, adjustment
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.driver_goals (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) on delete cascade not null,
  date date default CURRENT_DATE not null,
  target_deliveries integer default 10,
  current_deliveries integer default 0,
  target_earnings numeric default 100.00,
  current_earnings numeric default 0.00,
  unique(driver_id, date)
);

create table if not exists public.driver_achievements (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) on delete cascade not null,
  badge_code text not null,
  earned_at timestamp with time zone default now(),
  constraint unique_driver_badge_v3 unique (driver_id, badge_code)
);

-- --------------------------------------------------------
-- 5. LOYALTY & REWARDS
-- --------------------------------------------------------
create table if not exists public.customer_transactions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users on delete cascade not null,
  type text not null, -- earn, redeem, adjust
  points integer not null,
  amount_spent numeric default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.rewards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  points_required integer not null check (points_required >= 0),
  reward_type text not null, -- discount, free_item, cashback, custom
  value numeric,
  stock_limit integer,
  active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.reward_redemptions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users on delete cascade not null,
  reward_id uuid references public.rewards(id) on delete cascade not null,
  status text default 'pending', -- pending, approved, rejected, used
  approved_by uuid references auth.users,
  used_at timestamp with time zone,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 6. SYSTEM SETTINGS & UTILITIES
-- --------------------------------------------------------
create table if not exists public.app_settings (
  id integer primary key default 1,
  store_name text default 'Yalla Wasel',
  store_description text,
  logo_url text,
  contact_phone text,
  contact_email text,
  maintenance_mode boolean default false,
  whatsapp_notification_enabled boolean default true,
  whatsapp_number text,
  impact_percentage numeric default 3,
  impact_enabled boolean default true,
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

create table if not exists public.delivery_settings (
  id integer primary key default 1,
  enabled boolean default true,
  free_delivery_enabled boolean default true,
  free_delivery_min_order numeric default 50,
  default_fee numeric default 5,
  estimated_time_min integer default 30,
  estimated_time_max integer default 60,
  constraint single_row check (id = 1)
);

create table if not exists public.delivery_zones (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  fee numeric not null,
  min_order numeric,
  active boolean default true
);

create table if not exists public.delivery_schedule (
  id uuid default gen_random_uuid() primary key,
  day_of_week integer not null, -- 0=Sun, 6=Sat
  open_time text not null,
  close_time text not null,
  active boolean default true
);

create table if not exists public.user_fcm_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  fcm_token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fcm_token)
);

-- --------------------------------------------------------
-- 7. IMPACT & HAPPY HOURS
-- --------------------------------------------------------
create table if not exists public.impact_campaigns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  goal_amount numeric default 0,
  current_amount numeric default 0,
  goal_type text,
  impact_per_dollar numeric default 1,
  is_active boolean default true,
  show_on_impact_page boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_impact (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  campaign_id uuid references impact_campaigns(id) on delete cascade not null,
  order_id uuid references orders(id) on delete set null,
  contribution_amount numeric default 0,
  impact_units numeric default 0,
  impact_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.happy_hours (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_time time not null,
  end_time time not null,
  days_of_week integer[], -- 0=Sun, 6=Sat
  multiplier numeric default 1,
  bonus_points integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 8. INDEXES (Optimization)
-- --------------------------------------------------------
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_driver_id on orders(driver_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_is_active on products(is_active);

create index if not exists idx_driver_locations_driver_id on driver_locations(driver_id);
create index if not exists idx_driver_transactions_driver_id on driver_transactions(driver_id);
create index if not exists idx_driver_goals_date on driver_goals(date);

create index if not exists idx_user_impact_user_id on user_impact(user_id);
create index if not exists idx_reward_redemptions_customer_id on reward_redemptions(customer_id);

-- --------------------------------------------------------
-- 9. SECURITY (RLS Policies)
-- --------------------------------------------------------

-- Enable RLS on all tables
do $$
declare
  t text;
begin
  for t in (select table_name from information_schema.tables where table_schema = 'public') loop
    execute 'alter table public.' || t || ' enable row level security';
  end loop;
end;
$$;

-- PROFILES
drop policy if exists "Admin manage all profiles" on profiles;
create policy "Admin manage all profiles" on profiles for all using (is_admin());

drop policy if exists "Users view own profile" on profiles;
create policy "Users view own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- PRODUCTS
drop policy if exists "Public view active products" on products;
create policy "Public view active products" on products for select using (is_active = true);

drop policy if exists "Admin manage products" on products;
create policy "Admin manage products" on products for all using (is_admin());

-- ORDERS
drop policy if exists "Users view own orders" on orders;
create policy "Users view own orders" on orders for select using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on orders;
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);

drop policy if exists "Drivers view assigned orders" on orders;
create policy "Drivers view assigned orders" on orders for select using (auth.uid() = driver_id or is_driver());

drop policy if exists "Drivers update assigned orders" on orders;
create policy "Drivers update assigned orders" on orders for update using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

drop policy if exists "Admin manage all orders" on orders;
create policy "Admin manage all orders" on orders for all using (is_admin());

-- DRIVER OPERATIONS
drop policy if exists "Drivers manage own location" on driver_locations;
create policy "Drivers manage own location" on driver_locations for all using (auth.uid() = driver_id);

drop policy if exists "Drivers view own transactions" on driver_transactions;
create policy "Drivers view own transactions" on driver_transactions for select using (auth.uid() = driver_id);

drop policy if exists "Drivers manage own goals" on driver_goals;
create policy "Drivers manage own goals" on driver_goals for all using (auth.uid() = driver_id);

drop policy if exists "Drivers view own achievements" on driver_achievements;
create policy "Drivers view own achievements" on driver_achievements for select using (auth.uid() = driver_id);

drop policy if exists "Admin view all driver data" on driver_locations;
create policy "Admin view all driver data" on driver_locations for select using (is_admin());

-- LOYALTY
drop policy if exists "Users view own customer transactions" on customer_transactions;
create policy "Users view own customer transactions" on customer_transactions for select using (auth.uid() = customer_id);

drop policy if exists "Users manage own redemptions" on reward_redemptions;
create policy "Users manage own redemptions" on reward_redemptions for all using (auth.uid() = customer_id);

drop policy if exists "Public view rewards" on rewards;
create policy "Public view rewards" on rewards for select using (active = true);

-- IMPACT
drop policy if exists "Public view impact campaigns" on impact_campaigns;
create policy "Public view impact campaigns" on impact_campaigns for select using (is_active = true);

drop policy if exists "Users view own impact" on user_impact;
create policy "Users view own impact" on user_impact for select using (auth.uid() = user_id);

-- SETTINGS
drop policy if exists "Public view app settings" on app_settings;
create policy "Public view app settings" on app_settings for select using (true);

drop policy if exists "Public view delivery settings" on delivery_settings;
create policy "Public view delivery settings" on delivery_settings for select using (true);

-- --------------------------------------------------------
-- 10. TRIGGERS & AUTOMATION
-- --------------------------------------------------------

-- Update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on orders for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on app_settings for each row execute procedure handle_updated_at();

-- Auto-create driver records
create or replace function public.handle_new_driver_v3()
returns trigger as $$
begin
  if new.role = 'driver' then
    insert into public.driver_goals (driver_id) values (new.id) on conflict (driver_id, date) do nothing;
    insert into public.driver_locations (driver_id, latitude, longitude) values (new.id, 0, 0) on conflict (driver_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_driver_created_v3
  after insert or update of role on public.profiles
  for each row execute procedure public.handle_new_driver_v3();

-- Auto-update tier based on points
create or replace function public.handle_tier_update()
returns trigger as $$
begin
  if new.points >= 5000 then new.tier = 'Elite';
  elsif new.points >= 1500 then new.tier = 'Gold';
  elsif new.points >= 500 then new.tier = 'Silver';
  else new.tier = 'Bronze';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_points_update before update of points on profiles for each row execute procedure handle_tier_update();
