
-- 1. Create Profiles Table (Core User Data)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  phone text,
  address text,
  wallet_balance numeric default 0,
  points integer default 0,
  tier text default 'Bronze',
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price numeric not null,
  cost numeric default 0,
  stock integer default 0,
  category text,
  image text,
  is_active boolean default true
);

-- Ensure Columns Exist (Safe Update)
alter table public.products add column if not exists name_ar text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists description_ar text;
alter table public.products add column if not exists tags text[];
alter table public.products add column if not exists is_active boolean default true;

-- 3. Create Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  full_name text,
  phone text,
  address text,
  total numeric not null,
  status text default 'pending',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- CRITICAL FIX: Ensure these columns exist for Checkout to work
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists delivery_zone text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists delivery_fee numeric default 0;
alter table public.orders add column if not exists admin_notes text;

-- 4. Create App Settings (Singleton)
create table if not exists public.app_settings (
  id integer primary key default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  store_name text default 'Yalla Wasel',
  store_description text,
  logo_url text,
  contact_phone text,
  contact_email text,
  maintenance_mode boolean default false,
  config jsonb default '{}'::jsonb,
  constraint single_row check (id = 1)
);

-- 5. Create Delivery Tables
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

-- 6. Create Helper Tables
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  service_type text,
  user_id uuid references auth.users,
  status text default 'new'
);

create table if not exists public.admin_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  action text,
  admin_name text,
  type text default 'info'
);

create table if not exists public.happy_hours (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id uuid references products(id) not null,
  discount_price numeric not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_active boolean default true
);

-- 7. Enable RLS (Row Level Security)
alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table app_settings enable row level security;
alter table delivery_settings enable row level security;
alter table delivery_zones enable row level security;
alter table delivery_schedule enable row level security;
alter table leads enable row level security;
alter table admin_logs enable row level security;

-- 8. Create Policies (Drop first to avoid conflicts)

-- Products
drop policy if exists "Public Read Products" on products;
create policy "Public Read Products" on products for select using (true);

drop policy if exists "Public Write Products" on products;
create policy "Public Write Products" on products for all using (true);

-- Orders
-- Allow anyone to create orders (public write)
drop policy if exists "Public Read Orders" on orders;
drop policy if exists "Public Create Orders" on orders;
drop policy if exists "Admin Manage Orders" on orders;

create policy "Public Read Orders" on orders for select using (true);
create policy "Public Create Orders" on orders for insert with check (true);
create policy "Admin Manage Orders" on orders for all using (true);

-- App Settings
drop policy if exists "Public Read Settings" on app_settings;
create policy "Public Read Settings" on app_settings for select using (true);

drop policy if exists "Admin Write Settings" on app_settings;
create policy "Admin Write Settings" on app_settings for all using (true);

-- Delivery Settings
drop policy if exists "Public Read Delivery" on delivery_settings;
create policy "Public Read Delivery" on delivery_settings for select using (true);

drop policy if exists "Admin Write Delivery" on delivery_settings;
create policy "Admin Write Delivery" on delivery_settings for all using (true);

-- Delivery Zones
drop policy if exists "Public Read Zones" on delivery_zones;
create policy "Public Read Zones" on delivery_zones for select using (true);

drop policy if exists "Admin Write Zones" on delivery_zones;
create policy "Admin Write Zones" on delivery_zones for all using (true);

-- Profiles
drop policy if exists "Users Read Own Profile" on profiles;
create policy "Users Read Own Profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users Update Own Profile" on profiles;
create policy "Users Update Own Profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Admin Read Profiles" on profiles;
create policy "Admin Read Profiles" on profiles for select using (true);

-- Leads
drop policy if exists "Public Write Leads" on leads;
create policy "Public Write Leads" on leads for insert with check (true);

-- 9. Create RPC Function for Points (Called by App.tsx)
create or replace function increment_points(user_id uuid, amount int)
returns void as $$
begin
  update public.profiles
  set points = points + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- 17. Automatic Tier Upgrade Trigger
create or replace function auto_update_tier()
returns trigger as $$
begin
  -- Update tier based on points
  if new.points >= 5000 then
    update profiles set tier = 'VIP' where id = new.id;
  elsif new.points >= 1500 then
    update profiles set tier = 'Gold' where id = new.id;
  elsif new.points >= 500 then
    update profiles set tier = 'Silver' where id = new.id;
  else
    update profiles set tier = 'Bronze' where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists update_tier_trigger on profiles;
create trigger update_tier_trigger
  after update of points on profiles
  for each row
  execute function auto_update_tier();

-- Mouné Classes Table
create table if not exists public.moune_classes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  total_weight text,
  meals_count integer,
  price numeric not null,
  cost numeric default 0,
  image text,
  category text,
  is_active boolean default true,
  class_type text -- 'mini', 'classic', 'premium'
);

-- Mouné Class Components Table
create table if not exists public.moune_class_components (
  id uuid default gen_random_uuid() primary key,
  moune_class_id uuid references moune_classes(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  product_name_ar text,
  quantity integer default 1,
  unit text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Storage Setup
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Images" on storage.objects;
create policy "Public Access Images" on storage.objects for select using ( bucket_id = 'images' );

drop policy if exists "Public Upload Images" on storage.objects;
create policy "Public Upload Images" on storage.objects for insert with check ( bucket_id = 'images' );

-- 11. Enable RLS for Mouné tables
alter table moune_classes enable row level security;
alter table moune_class_components enable row level security;

-- Mouné Classes Policies
drop policy if exists "Public Read Mouné Classes" on moune_classes;
create policy "Public Read Mouné Classes" on moune_classes for select using (true);

drop policy if exists "Admin Write Mouné Classes" on moune_classes;
create policy "Admin Write Mouné Classes" on moune_classes for all using (true);

-- Mouné Components Policies
drop policy if exists "Public Read Mouné Components" on moune_class_components;
create policy "Public Read Mouné Components" on moune_class_components for select using (true);

drop policy if exists "Admin Write Mouné Components" on moune_class_components;
create policy "Admin Write Mouné Components" on moune_class_components for all using (true);

-- 12. Customer Transactions Table
create table if not exists public.customer_transactions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users on delete cascade not null,
  type text not null, -- earn | redeem | adjust
  points integer not null,
  amount_spent numeric default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Rewards Table
create table if not exists public.rewards (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  points_required integer not null,
  reward_type text not null, -- discount | free_item | cashback | custom
  value numeric,
  stock_limit integer,
  active boolean default true,
  expires_at timestamp with time zone
);

-- 14. Reward Redemptions Table
create table if not exists public.reward_redemptions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_id uuid references auth.users on delete cascade not null,
  reward_id uuid references rewards on delete cascade not null,
  status text default 'pending', -- pending | approved | rejected | used
  approved_by uuid references auth.users,
  used_at timestamp with time zone,
  note text
);

-- 15. Happy Hours System Table
create table if not exists public.happy_hours_schedule (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  days_of_week integer[], -- 0=Sun, 1=Mon, ..., 6=Sat
  multiplier numeric default 1, -- e.g., 2x points
  bonus_points integer default 0,
  active boolean default true
);

-- 16. FCM Tokens Table for Push Notifications
create table if not exists public.user_fcm_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  fcm_token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fcm_token)
);

-- Enable RLS for new tables
alter table customer_transactions enable row level security;
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;
alter table happy_hours_schedule enable row level security;
alter table user_fcm_tokens enable row level security;

-- Customer Transactions Policies
drop policy if exists "Users Read Own Transactions" on customer_transactions;
create policy "Users Read Own Transactions" on customer_transactions for select using (auth.uid() = customer_id);

drop policy if exists "Admin Manage Transactions" on customer_transactions;
create policy "Admin Manage Transactions" on customer_transactions for all using (true);

-- Rewards Policies
drop policy if exists "Public Read Active Rewards" on rewards;
create policy "Public Read Active Rewards" on rewards for select using (active = true);

drop policy if exists "Admin Manage Rewards" on rewards;
create policy "Admin Manage Rewards" on rewards for all using (true);

-- Reward Redemptions Policies
drop policy if exists "Users Read Own Redemptions" on reward_redemptions;
create policy "Users Read Own Redemptions" on reward_redemptions for select using (auth.uid() = customer_id);

drop policy if exists "Users Create Redemptions" on reward_redemptions;
create policy "Users Create Redemptions" on reward_redemptions for insert with check (auth.uid() = customer_id);

drop policy if exists "Admin Manage Redemptions" on reward_redemptions;
create policy "Admin Manage Redemptions" on reward_redemptions for all using (true);

-- Happy Hours Schedule Policies
drop policy if exists "Public Read Active Happy Hours" on happy_hours_schedule;
create policy "Public Read Active Happy Hours" on happy_hours_schedule for select using (active = true);

drop policy if exists "Admin Manage Happy Hours" on happy_hours_schedule;
create policy "Admin Manage Happy Hours" on happy_hours_schedule for all using (true);

-- FCM Tokens Policies
drop policy if exists "Users Manage Own FCM Tokens" on user_fcm_tokens;
create policy "Users Manage Own FCM Tokens" on user_fcm_tokens for all using (auth.uid() = user_id);

drop policy if exists "Admin Read FCM Tokens" on user_fcm_tokens;
create policy "Admin Read FCM Tokens" on user_fcm_tokens for select using (true);

-- =============================================
-- ORDER MANAGEMENT SYSTEM ENHANCEMENTS
-- =============================================

-- Add enhanced columns to orders table
alter table public.orders add column if not exists full_name text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists updated_at timestamptz;
alter table public.orders add column if not exists admin_notes text;

-- Create order status history table for timeline tracking
create table if not exists public.order_status_history (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  status text not null,
  note text,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- Enable RLS for order_status_history
alter table public.order_status_history enable row level security;

-- Order Status History Policies
drop policy if exists "Users Read Own Order History" on order_status_history;
create policy "Users Read Own Order History" on order_status_history for select using (
  exists (
    select 1 from orders 
    where orders.id = order_status_history.order_id 
    and orders.user_id = auth.uid()
  )
);

drop policy if exists "Admin Manage Order History" on order_status_history;
create policy "Admin Manage Order History" on order_status_history for all using (true);

-- Create indexes for performance
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_status_history_order_id on order_status_history(order_id);

-- Add updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_orders_updated_at on orders;
create trigger update_orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at_column();

-- =============================================
-- APP SETTINGS FOR WHATSAPP NOTIFICATION
-- =============================================

alter table public.app_settings add column if not exists whatsapp_notification_enabled boolean default true;
alter table public.app_settings add column if not exists whatsapp_number text;

-- =============================================
-- IMPACT SYSTEM TABLES
-- =============================================

-- Impact Campaigns
create table if not exists public.impact_campaigns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  image_url text,
  goal_amount numeric default 0,
  current_amount numeric default 0,
  goal_type text, -- trees, meals, donations, etc
  impact_per_dollar numeric default 1, -- how many impact units per dollar
  is_active boolean default true,
  show_on_impact_page boolean default true
);

-- User Impact Contributions
create table if not exists public.user_impact (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade,
  campaign_id uuid references impact_campaigns(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  contribution_amount numeric default 0,
  impact_units numeric default 0, -- trees planted, meals funded, etc
  impact_type text -- trees, meals, donations
);

-- App Settings for Impact Configuration
alter table public.app_settings add column if not exists impact_percentage numeric default 3; -- 3% of order goes to impact
alter table public.app_settings add column if not exists impact_enabled boolean default true;

-- RLS for Impact Tables
alter table public.impact_campaigns enable row level security;
alter table public.user_impact enable row level security;

-- Impact Campaigns Policies
drop policy if exists "Public Read Active Impact Campaigns" on impact_campaigns;
create policy "Public Read Active Impact Campaigns" on impact_campaigns for select using (is_active = true);

drop policy if exists "Admin Manage Impact Campaigns" on impact_campaigns;
create policy "Admin Manage Impact Campaigns" on impact_campaigns for all using (true);

-- User Impact Policies
drop policy if exists "Users Read Own Impact" on user_impact;
create policy "Users Read Own Impact" on user_impact for select using (auth.uid() = user_id);

drop policy if exists "Users Insert Own Impact" on user_impact;
create policy "Users Insert Own Impact" on user_impact for insert with check (auth.uid() = user_id);

drop policy if exists "Admin Read All Impact" on user_impact;
create policy "Admin Read All Impact" on user_impact for select using (true);

-- Create indexes for performance
create index if not exists idx_user_impact_user_id on user_impact(user_id);
create index if not exists idx_user_impact_campaign_id on user_impact(campaign_id);
create index if not exists idx_impact_campaigns_active on impact_campaigns(is_active);


