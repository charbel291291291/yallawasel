-- 🧱 STEP 1 — DATABASE DESIGN (Merged with existing schema for compatibility)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure all new lifecycle columns exist in existing table
alter table orders add column if not exists customer_id uuid references auth.users(id) on delete cascade;
alter table orders add column if not exists driver_id uuid references auth.users(id);
alter table orders add column if not exists pickup_address text;
alter table orders add column if not exists dropoff_address text;
alter table orders add column if not exists price numeric;
alter table orders add column if not exists full_name text;
alter table orders add column if not exists phone text;
alter table orders add column if not exists address text;
alter table orders add column if not exists total numeric;
alter table orders add column if not exists items jsonb;
alter table orders add column if not exists delivery_fee numeric default 0;
alter table orders add column if not exists payment_method text default 'cash';
alter table orders add column if not exists delivery_zone text;
alter table orders add column if not exists notes text;

-- Allowed statuses constraint (Step 1)
alter table orders drop constraint if exists valid_status;
alter table orders
add constraint valid_status
check (status in ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled', 'approved', 'preparing', 'out_for_delivery'));

-- 🔐 STEP 2 — ROW LEVEL SECURITY
alter table orders enable row level security;

-- Drop existing policies
drop policy if exists "customer can read own orders" on orders;
drop policy if exists "customer can insert order" on orders;
drop policy if exists "driver can read available orders" on orders;
drop policy if exists "driver can accept order" on orders;

-- Customer policies
create policy "customer can read own orders"
on orders
for select
using (auth.uid() = customer_id OR auth.uid() = user_id);

create policy "customer can insert order"
on orders
for insert
with check (auth.uid() = customer_id OR auth.uid() = user_id);

-- Driver policies
create policy "driver can read available orders"
on orders
for select
using (
  status = 'pending'
  OR driver_id = auth.uid()
);

create policy "driver can accept order"
on orders
for update
using (status = 'pending')
with check (
  driver_id = auth.uid()
  AND status = 'assigned'
);

-- 🛡 STEP 7 — ANTI-RACE HARDENING (Postgres Function)
create or replace function accept_order(order_uuid uuid)
returns setof orders
language plpgsql
security definer
as $$
declare
  updated_order orders;
begin
  update orders
  set status = 'assigned',
      driver_id = auth.uid(),
      updated_at = now()
  where id = order_uuid
    and status = 'pending'
  returning * into updated_order;

  if not found then
    raise exception 'Order already taken or does not exist';
  end if;

  -- Add to audit trail
  insert into order_status_history (order_id, status, note, created_by)
  values (order_uuid, 'assigned', 'Order accepted by driver', auth.uid());

  return next updated_order;
end;
$$;

-- Ensure Realtime is enabled
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  
  begin
    alter publication supabase_realtime add table orders;
  exception
    when duplicate_object then null; -- Table already exists in publication
    when others then null;
  end;
end $$;
