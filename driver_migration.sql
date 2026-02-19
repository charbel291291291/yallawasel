-- =============================================
-- DRIVER PWA MIGRATION
-- =============================================

-- 1. Add Role to Profiles
-- Default to 'customer'. Other values: 'admin', 'driver'.
alter table public.profiles add column if not exists role text default 'customer';

-- 2. Add Driver fields to Orders
alter table public.orders add column if not exists driver_id uuid references auth.users(id);

-- 3. Driver Location Tracking Table
create table if not exists public.driver_locations (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references auth.users(id) not null,
  latitude numeric not null,
  longitude numeric not null,
  updated_at timestamp with time zone default now()
);

-- Enable RLS for driver locations
alter table public.driver_locations enable row level security;

-- 4. RLS Policies for Drivers

-- Drivers can read orders assigned to them
create policy "Drivers Read Assigned Orders" on public.orders
  for select
  using (auth.uid() = driver_id);

-- Drivers can update status of assigned orders
create policy "Drivers Update Assigned Orders" on public.orders
  for update
  using (auth.uid() = driver_id);

-- Drivers can update their own location
create policy "Drivers Update Own Location" on public.driver_locations
  for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- Admin and Customers can read driver locations (for tracking)
create policy "Public Read Driver Locations" on public.driver_locations
  for select
  using (true);
