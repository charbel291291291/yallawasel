
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
  total numeric not null,
  status text default 'pending'
);

-- CRITICAL FIX: Ensure these columns exist for Checkout to work
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists delivery_zone text;
alter table public.orders add column if not exists notes text;

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
drop policy if exists "Users Read Own Orders" on orders;
create policy "Users Read Own Orders" on orders for select using (auth.uid() = user_id);

drop policy if exists "Users Create Orders" on orders;
create policy "Users Create Orders" on orders for insert with check (auth.uid() = user_id);

drop policy if exists "Admin Read Orders" on orders;
create policy "Admin Read Orders" on orders for select using (true);

drop policy if exists "Admin Write Orders" on orders;
create policy "Admin Write Orders" on orders for all using (true);

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

-- 12. FCM Tokens Table for Push Notifications
create table if not exists public.user_fcm_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  fcm_token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fcm_token)
);

-- Enable RLS for FCM tokens table
alter table user_fcm_tokens enable row level security;

-- FCM Tokens Policies
drop policy if exists "Users Manage Own FCM Tokens" on user_fcm_tokens;
create policy "Users Manage Own FCM Tokens" on user_fcm_tokens for all using (auth.uid() = user_id);

drop policy if exists "Admin Read FCM Tokens" on user_fcm_tokens;
create policy "Admin Read FCM Tokens" on user_fcm_tokens for select using (true);
