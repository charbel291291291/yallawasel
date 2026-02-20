-- 🛰️ ENTERPRISE DISPATCH SYSTEM - POSTGRES CORE
-- 📍 3️⃣ LOCATION RADIUS MATCHING SUPPORT
create extension if not exists cube;
create extension if not exists earthdistance;

-- 🧱 1️⃣ ORDER EXPIRATION & DISPATCH FIELDS
alter table orders add column if not exists expires_at timestamptz;
alter table orders add column if not exists expired boolean default false;
alter table orders add column if not exists pickup_lat double precision;
alter table orders add column if not exists pickup_lng double precision;

-- Initialize expires_at for existing pending orders
update orders set expires_at = created_at + interval '2 minutes' where status = 'pending' and expires_at is null;

-- 🟢 2️⃣ DRIVER ONLINE / OFFLINE STATE
create table if not exists drivers (
  id uuid primary key references auth.users(id) on delete cascade,
  is_online boolean default false,
  last_seen timestamptz default now(),
  lat double precision,
  lng double precision,
  push_token text,
  updated_at timestamptz default now()
);

-- Enable RLS on drivers
alter table drivers enable row level security;

-- Drivers can insert/update their own status
create policy "drivers can insert own status"
on drivers for insert
with check (auth.uid() = id);

create policy "drivers can update own status"
on drivers for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Anyone (authenticated) can see online drivers for dispatching context
create policy "authenticated can see drivers"
on drivers for select
to authenticated
using (true);

-- 📍 3️⃣ LOCATION RADIUS MATCHING FUNCTION
create or replace function nearby_drivers(order_id uuid, radius_km float)
returns table(driver_id uuid, distance_meters float)
language sql
security definer
as $$
select d.id, 
       earth_distance(ll_to_earth(d.lat, d.lng), ll_to_earth(o.pickup_lat, o.pickup_lng))::float as distance_meters
from drivers d
join orders o on o.id = order_id
where d.is_online = true
and d.last_seen > now() - interval '1 minute' -- Pulse check
and earth_distance(ll_to_earth(d.lat, d.lng), ll_to_earth(o.pickup_lat, o.pickup_lng)) < radius_km * 1000;
$$;

-- 🤖 4️⃣ AUTO-ASSIGN ALGORITHM
create or replace function auto_assign(order_uuid uuid)
returns setof orders
language plpgsql
security definer
as $$
declare
  match_driver_id uuid;
  updated_order orders;
begin
  -- Find closest online driver within 5km
  select driver_id into match_driver_id 
  from nearby_drivers(order_uuid, 5) 
  order by distance_meters asc 
  limit 1;

  if match_driver_id is not null then
    update orders
    set status = 'assigned',
        driver_id = match_driver_id,
        updated_at = now()
    where id = order_uuid
      and status = 'pending'
    returning * into updated_order;

    if found then
      -- Log to audit trail
      insert into order_status_history (order_id, status, note, created_by)
      values (order_uuid, 'assigned', 'System auto-assigned closest driver', match_driver_id);
      
      return next updated_order;
    end if;
  end if;

  return;
end;
$$;

-- Expiration Worker Function
create or replace function expire_orders()
returns void
language plpgsql
security definer
as $$
begin
  update orders
  set status = 'cancelled',
      expired = true,
      updated_at = now()
  where status = 'pending'
    and expires_at < now();
    
  -- Log expirations (bulk insert for efficiency)
  insert into order_status_history (order_id, status, note)
  select id, 'cancelled', 'Order expired (no driver accepted within 2 minutes)'
  from orders
  where expired = true and status = 'cancelled'
  and not exists (
    select 1 from order_status_history h 
    where h.order_id = orders.id and h.status = 'cancelled' and h.note like 'Order expired%'
  );
end;
$$;

-- 🔐 10️⃣ RLS HARDENING - Prevent blind updates
drop policy if exists "driver can accept order" on orders;
create policy "driver can accept order"
on orders
for update
using (status = 'pending' and expired = false)
with check (
  driver_id = auth.uid()
  AND status = 'assigned'
);

-- Trigger to auto-set expires_at on insert
create or replace function set_order_expiration()
returns trigger as $$
begin
  if new.expires_at is null then
    new.expires_at := now() + interval '2 minutes';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_set_order_expiration on orders;
create trigger tr_set_order_expiration
before insert on orders
for each row
execute function set_order_expiration();

-- Enable Realtime for drivers table
do $$
begin
  begin
    alter publication supabase_realtime add table drivers;
  exception
    when duplicate_object then null;
    when others then null;
  end;
end $$;
