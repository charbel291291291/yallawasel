
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


-- 10. Storage Setup
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Images" on storage.objects;
create policy "Public Access Images" on storage.objects for select using ( bucket_id = 'images' );

drop policy if exists "Public Upload Images" on storage.objects;
create policy "Public Upload Images" on storage.objects for insert with check ( bucket_id = 'images' );



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


- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   D R I V E R   P W A   M I G R A T I O N  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   A d d   R o l e   t o   P r o f i l e s  
 - -   D e f a u l t   t o   ' c u s t o m e r ' .   O t h e r   v a l u e s :   ' a d m i n ' ,   ' d r i v e r ' .  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   r o l e   t e x t   d e f a u l t   ' c u s t o m e r ' ;  
  
 - -   2 .   A d d   D r i v e r   f i e l d s   t o   O r d e r s  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d ) ;  
  
 - -   3 .   D r i v e r   L o c a t i o n   T r a c k i n g   T a b l e  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ l o c a t i o n s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     l a t i t u d e   n u m e r i c   n o t   n u l l ,  
     l o n g i t u d e   n u m e r i c   n o t   n u l l ,  
     u p d a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   E n a b l e   R L S   f o r   d r i v e r   l o c a t i o n s  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ l o c a t i o n s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
  
 - -   4 .   R L S   P o l i c i e s   f o r   D r i v e r s  
  
 - -   D r i v e r s   c a n   r e a d   o r d e r s   a s s i g n e d   t o   t h e m  
 c r e a t e   p o l i c y   " D r i v e r s   R e a d   A s s i g n e d   O r d e r s "   o n   p u b l i c . o r d e r s  
     f o r   s e l e c t  
     u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
  
 - -   D r i v e r s   c a n   u p d a t e   s t a t u s   o f   a s s i g n e d   o r d e r s  
 c r e a t e   p o l i c y   " D r i v e r s   U p d a t e   A s s i g n e d   O r d e r s "   o n   p u b l i c . o r d e r s  
     f o r   u p d a t e  
     u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
  
 - -   D r i v e r s   c a n   u p d a t e   t h e i r   o w n   l o c a t i o n  
 c r e a t e   p o l i c y   " D r i v e r s   U p d a t e   O w n   L o c a t i o n "   o n   p u b l i c . d r i v e r _ l o c a t i o n s  
     f o r   a l l  
     u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d )  
     w i t h   c h e c k   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
  
 - -   A d m i n   a n d   C u s t o m e r s   c a n   r e a d   d r i v e r   l o c a t i o n s   ( f o r   t r a c k i n g )  
 c r e a t e   p o l i c y   " P u b l i c   R e a d   D r i v e r   L o c a t i o n s "   o n   p u b l i c . d r i v e r _ l o c a t i o n s  
     f o r   s e l e c t  
     u s i n g   ( t r u e ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   D R I V E R   P W A   E N H A N C E M E N T S   M I G R A T I O N  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   E n h a n c e   P r o f i l e s   f o r   D r i v e r   D e t a i l s  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   v e h i c l e _ t y p e   t e x t ;   - -   ' b i k e ' ,   ' c a r ' ,   ' v a n '  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   v e h i c l e _ p l a t e   t e x t ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   i s _ o n l i n e   b o o l e a n   d e f a u l t   f a l s e ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ s t a t u s   t e x t   d e f a u l t   ' o f f l i n e ' ;   - -   ' o n l i n e ' ,   ' b u s y ' ,   ' o f f l i n e '  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   r a t i n g   n u m e r i c   d e f a u l t   5 . 0 ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   t o t a l _ d e l i v e r i e s   i n t e g e r   d e f a u l t   0 ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   a c c e p t a n c e _ r a t e   n u m e r i c   d e f a u l t   1 0 0 . 0 ;  
  
 - -   2 .   E n h a n c e   O r d e r s   f o r   D e l i v e r y   P r o o f   &   W o r k f l o w  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d e l i v e r y _ p r o o f _ u r l   t e x t ;  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   c u s t o m e r _ s i g n a t u r e _ u r l   t e x t ;  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ f e e d b a c k   t e x t ;  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ a c c e p t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e ;  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ a r r i v e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e ;  
 a l t e r   t a b l e   p u b l i c . o r d e r s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ p i c k e d _ u p _ a t   t i m e s t a m p   w i t h   t i m e   z o n e ;  
  
 - -   3 .   D r i v e r   T r a n s a c t i o n s   ( E a r n i n g s )  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ t r a n s a c t i o n s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     o r d e r _ i d   u u i d   r e f e r e n c e s   p u b l i c . o r d e r s ( i d ) ,  
     a m o u n t   n u m e r i c   n o t   n u l l ,  
     t y p e   t e x t   n o t   n u l l ,   - -   ' c o m m i s s i o n ' ,   ' t i p ' ,   ' p a y o u t ' ,   ' a d j u s t m e n t '  
     d e s c r i p t i o n   t e x t ,  
     c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   4 .   D r i v e r   A c h i e v e m e n t s   /   B a d g e s  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ a c h i e v e m e n t s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     b a d g e _ c o d e   t e x t   n o t   n u l l ,   - -   ' f a s t _ d r i v e r ' ,   ' t o p _ p e r f o r m e r _ w e e k '  
     e a r n e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( ) ,  
     c o n s t r a i n t   u n i q u e _ d r i v e r _ b a d g e   u n i q u e   ( d r i v e r _ i d ,   b a d g e _ c o d e )  
 ) ;  
  
 - -   5 .   D r i v e r   D a i l y   S t a t s   ( f o r   G o a l s / P e r f o r m a n c e )  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ d a i l y _ s t a t s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     d a t e   d a t e   n o t   n u l l   d e f a u l t   C U R R E N T _ D A T E ,  
     d e l i v e r i e s _ c o u n t   i n t e g e r   d e f a u l t   0 ,  
     e a r n i n g s   n u m e r i c   d e f a u l t   0 ,  
     o n l i n e _ h o u r s   n u m e r i c   d e f a u l t   0 ,  
     d i s t a n c e _ k m   n u m e r i c   d e f a u l t   0 ,  
     u n i q u e ( d r i v e r _ i d ,   d a t e )  
 ) ;  
  
 - -   R L S   P O L I C I E S  
  
 - -   D r i v e r   T r a n s a c t i o n s  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ t r a n s a c t i o n s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " D r i v e r s   R e a d   O w n   T r a n s a c t i o n s "   o n   p u b l i c . d r i v e r _ t r a n s a c t i o n s   f o r   s e l e c t   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
 c r e a t e   p o l i c y   " A d m i n   M a n a g e   D r i v e r   T r a n s a c t i o n s "   o n   p u b l i c . d r i v e r _ t r a n s a c t i o n s   f o r   a l l   u s i n g   ( t r u e ) ;  
  
 - -   D r i v e r   A c h i e v e m e n t s  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ a c h i e v e m e n t s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " D r i v e r s   R e a d   O w n   A c h i e v e m e n t s "   o n   p u b l i c . d r i v e r _ a c h i e v e m e n t s   f o r   s e l e c t   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
 c r e a t e   p o l i c y   " A d m i n   M a n a g e   D r i v e r   A c h i e v e m e n t s "   o n   p u b l i c . d r i v e r _ a c h i e v e m e n t s   f o r   a l l   u s i n g   ( t r u e ) ;  
  
 - -   D r i v e r   D a i l y   S t a t s  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ d a i l y _ s t a t s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " D r i v e r s   R e a d   O w n   D a i l y   S t a t s "   o n   p u b l i c . d r i v e r _ d a i l y _ s t a t s   f o r   s e l e c t   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
 c r e a t e   p o l i c y   " A d m i n   M a n a g e   D r i v e r   D a i l y   S t a t s "   o n   p u b l i c . d r i v e r _ d a i l y _ s t a t s   f o r   a l l   u s i n g   ( t r u e ) ;  
  
 - -   U p d a t e   P r o f i l e s   p r o p e r t i e s  
 c r e a t e   p o l i c y   " D r i v e r s   U p d a t e   O w n   S t a t u s "   o n   p u b l i c . p r o f i l e s   f o r   u p d a t e   u s i n g   ( a u t h . u i d ( )   =   i d ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   D R I V E R   P W A   V 2   A R C H I T E C T U R E   S C H E M A  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   D R I V E R S   P R O F I L E S   ( E x t e n d s   a u t h . u s e r s )  
 - -   " D r i v e r s   T a b l e "   r e q u i r e m e n t   m a p p i n g  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   v e h i c l e _ n u m b e r   t e x t ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   d r i v e r _ s t a t u s   t e x t   d e f a u l t   ' o f f l i n e ' ;   - -   a c t i v e / o f f l i n e / b u s y  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   t o t a l _ d e l i v e r i e s   i n t e g e r   d e f a u l t   0 ;  
 a l t e r   t a b l e   p u b l i c . p r o f i l e s   a d d   c o l u m n   i f   n o t   e x i s t s   r a t i n g   n u m e r i c   d e f a u l t   5 . 0 ;  
 - -   n a m e ,   p h o n e ,   c r e a t e d _ a t   a l r e a d y   e x i s t   i n   p r o f i l e s  
  
 - -   2 .   D R I V E R   L O C A T I O N  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ l o c a t i o n s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l   u n i q u e ,  
     l a t i t u d e   n u m e r i c   n o t   n u l l ,  
     l o n g i t u d e   n u m e r i c   n o t   n u l l ,  
     l a s t _ u p d a t e d   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   3 .   D R I V E R   E A R N I N G S   ( T r a n s a c t i o n s )  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ e a r n i n g s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     o r d e r _ i d   u u i d   r e f e r e n c e s   p u b l i c . o r d e r s ( i d ) ,  
     a m o u n t   n u m e r i c   n o t   n u l l ,  
     c o m m i s s i o n   n u m e r i c   d e f a u l t   0 ,  
     p a y m e n t _ t y p e   t e x t ,   - -   ' c a s h ' ,   ' t r a n s f e r ' ,   ' w a l l e t '  
     c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   4 .   D R I V E R   W A L L E T  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ w a l l e t s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l   u n i q u e ,  
     b a l a n c e   n u m e r i c   d e f a u l t   0 . 0 0 ,  
     p e n d i n g _ w i t h d r a w a l   n u m e r i c   d e f a u l t   0 . 0 0 ,  
     u p d a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( )  
 ) ;  
  
 - -   5 .   D R I V E R   A C H I E V E M E N T S   /   G A M I F I C A T I O N  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ a c h i e v e m e n t s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     b a d g e _ n a m e   t e x t   n o t   n u l l ,  
     m i l e s t o n e _ r e a c h e d   t e x t ,  
     a c h i e v e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   d e f a u l t   n o w ( ) ,  
     c o n s t r a i n t   u n i q u e _ d r i v e r _ b a d g e _ v 2   u n i q u e   ( d r i v e r _ i d ,   b a d g e _ n a m e )  
 ) ;  
  
 - -   6 .   D R I V E R   G O A L S   ( D a i l y   T a r g e t s )  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   p u b l i c . d r i v e r _ g o a l s   (  
     i d   u u i d   d e f a u l t   g e n _ r a n d o m _ u u i d ( )   p r i m a r y   k e y ,  
     d r i v e r _ i d   u u i d   r e f e r e n c e s   a u t h . u s e r s ( i d )   n o t   n u l l ,  
     d a t e   d a t e   d e f a u l t   C U R R E N T _ D A T E ,  
     t a r g e t _ d e l i v e r i e s   i n t e g e r   d e f a u l t   1 0 ,  
     c u r r e n t _ d e l i v e r i e s   i n t e g e r   d e f a u l t   0 ,  
     t a r g e t _ e a r n i n g s   n u m e r i c   d e f a u l t   1 0 0 . 0 0 ,  
     c u r r e n t _ e a r n i n g s   n u m e r i c   d e f a u l t   0 . 0 0 ,  
     u n i q u e ( d r i v e r _ i d ,   d a t e )  
 ) ;  
  
 - -   I N D E X E S   f o r   O p t i m i z a t i o n  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ d r i v e r _ l o c a t i o n s _ d r i v e r _ i d   o n   p u b l i c . d r i v e r _ l o c a t i o n s ( d r i v e r _ i d ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ d r i v e r _ e a r n i n g s _ d r i v e r _ i d   o n   p u b l i c . d r i v e r _ e a r n i n g s ( d r i v e r _ i d ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ d r i v e r _ e a r n i n g s _ c r e a t e d _ a t   o n   p u b l i c . d r i v e r _ e a r n i n g s ( c r e a t e d _ a t ) ;  
 c r e a t e   i n d e x   i f   n o t   e x i s t s   i d x _ o r d e r s _ d r i v e r _ i d _ s t a t u s   o n   p u b l i c . o r d e r s ( d r i v e r _ i d ,   s t a t u s ) ;  
  
 - -   R L S   P O L I C I E S  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ w a l l e t s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " D r i v e r s   v i e w   o w n   w a l l e t "   o n   p u b l i c . d r i v e r _ w a l l e t s   f o r   s e l e c t   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
  
 a l t e r   t a b l e   p u b l i c . d r i v e r _ g o a l s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " D r i v e r s   v i e w   o w n   g o a l s "   o n   p u b l i c . d r i v e r _ g o a l s   f o r   s e l e c t   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
 c r e a t e   p o l i c y   " D r i v e r s   u p d a t e   o w n   g o a l s "   o n   p u b l i c . d r i v e r _ g o a l s   f o r   u p d a t e   u s i n g   ( a u t h . u i d ( )   =   d r i v e r _ i d ) ;  
  
 - -   T R I G G E R   t o   a u t o - c r e a t e   w a l l e t   a n d   g o a l s   f o r   n e w   d r i v e r s  
 c r e a t e   o r   r e p l a c e   f u n c t i o n   p u b l i c . h a n d l e _ n e w _ d r i v e r ( )  
 r e t u r n s   t r i g g e r   a s   $ $  
 b e g i n  
     i f   n e w . r o l e   =   ' d r i v e r '   t h e n  
         i n s e r t   i n t o   p u b l i c . d r i v e r _ w a l l e t s   ( d r i v e r _ i d )   v a l u e s   ( n e w . i d )   o n   c o n f l i c t   d o   n o t h i n g ;  
         i n s e r t   i n t o   p u b l i c . d r i v e r _ g o a l s   ( d r i v e r _ i d )   v a l u e s   ( n e w . i d )   o n   c o n f l i c t   d o   n o t h i n g ;  
     e n d   i f ;  
     r e t u r n   n e w ;  
 e n d ;  
 $ $   l a n g u a g e   p l p g s q l   s e c u r i t y   d e f i n e r ;  
  
 c r e a t e   t r i g g e r   o n _ d r i v e r _ c r e a t e d  
     a f t e r   i n s e r t   o r   u p d a t e   o n   p u b l i c . p r o f i l e s  
     f o r   e a c h   r o w   e x e c u t e   p r o c e d u r e   p u b l i c . h a n d l e _ n e w _ d r i v e r ( ) ;  
 