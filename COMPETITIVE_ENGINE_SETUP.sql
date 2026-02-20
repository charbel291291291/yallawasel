-- 🏁 YALLA WASEL COMPETITIVE ENGINE v1.0
-- 🛡️ 1. PROFIT PROTECTION & COMPETITIVE SCHEMA

-- Audit Trail for all competitive transitions
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Extend Orders for incentive tracking
alter table orders add column if not exists payout_base numeric default 0;
alter table orders add column if not exists payout_bonus numeric default 0;
alter table orders add column if not exists margin_floor_ratio numeric default 0.20; -- 20% min profit
alter table orders add column if not exists search_started_at timestamptz default now();
alter table orders add column if not exists boost_level integer default 0; -- 0:Golden, 1:Warm, 2:Boost
alter table orders add column if not exists matched_at timestamptz;

-- Extend Drivers for competitive scoring
alter table drivers add column if not exists speed_score integer default 80 check (speed_score between 0 and 100);
alter table drivers add column if not exists tier text default 'Bronze' check (tier in ('Bronze', 'Silver', 'Gold', 'Elite'));
alter table drivers add column if not exists acceptance_rate numeric default 1.0;
alter table drivers add column if not exists total_accepted integer default 0;
alter table drivers add column if not exists total_ignored integer default 0;
alter table drivers add column if not exists last_rejection_at timestamptz;
alter table drivers add column if not exists consecutive_ignored integer default 0;

-- 🧠 2. PROFIT PROTECTION CALCULATOR
-- Internal helper to determine if we can afford a bonus
create or replace function can_apply_bonus(order_id uuid, bonus_amount numeric)
returns boolean as $$
declare
  o_total numeric;
  o_base_payout numeric;
  o_margin_floor numeric;
begin
  select total, payout_base, margin_floor_ratio into o_total, o_base_payout, o_margin_floor
  from orders where id = order_id;
  
  -- Logic: Total - (Payout + Bonus) >= Total * MarginFloor
  return (o_total - (o_base_payout + bonus_amount)) >= (o_total * o_margin_floor);
end;
$$ language plpgsql security definer;

-- 🎯 3. SMART MATCHING RANKING
-- Replaces simple nearby_drivers with a weighted scoring model
create or replace function competitive_dispatch(order_uuid uuid)
returns table(driver_id uuid, match_score float)
language plpgsql
security definer
as $$
begin
  return query
  select 
    d.id as driver_id,
    (
      (1.0 / (1.0 + earth_distance(ll_to_earth(d.lat, d.lng), ll_to_earth(o.pickup_lat, o.pickup_lng)) / 1000.0) * 0.4) + -- 40% Proximity
      ((d.speed_score / 100.0) * 0.4) +                                                                              -- 40% Reliability
      (case when d.tier = 'Elite' then 0.2 when d.tier = 'Gold' then 0.1 else 0.0 end)                             -- 20% Rank Priority
    )::float as match_score
  from drivers d
  join orders o on o.id = order_uuid
  where d.is_online = true
    and d.last_seen > now() - interval '45 seconds'
    and d.consecutive_ignored < 5 -- Anti-gaming throttle
  order by match_score desc
  limit 10;
end;
$$;

-- ⚡ 4. ATOMIC ACCEPTANCE WITH INCENTIVES (v2)
create or replace function accept_order_v3(order_uuid uuid)
returns setof orders
language plpgsql
security definer
as $$
declare
  updated_order orders;
  speed_bonus numeric := 0;
  elapsed_seconds integer;
begin
  -- Calculate elapsed time for potential Speed Bonus
  select extract(epoch from (now() - search_started_at))::integer into elapsed_seconds
  from orders where id = order_uuid;

  -- Logic: Golden Window (0-45s) gets a small bonus if margin allows
  if elapsed_seconds < 45 then
    if can_apply_bonus(order_uuid, 2.0) then -- $2.0 bonus for speed
      speed_bonus := 2.0;
    end if;
  end if;

  update orders
  set status = 'assigned',
      driver_id = auth.uid(),
      payout_bonus = speed_bonus,
      matched_at = now(),
      updated_at = now()
  where id = order_uuid
    and status = 'pending'
    and expired = false
  returning * into updated_order;

  if not found then
    raise exception 'Order already taken, expired, or unavailable';
  end if;

  -- Update Driver Stats
  update drivers
  set speed_score = least(100, speed_score + 2),
      total_accepted = total_accepted + 1,
      consecutive_ignored = 0
  where id = auth.uid();

  -- Audit log
  insert into order_status_history (order_id, status, note, created_by)
  values (order_uuid, 'assigned', format('Order accepted with $%s speed bonus', speed_bonus), auth.uid());

  return next updated_order;
end;
$$;

-- 🤖 5. DYNAMIC BOOST WORKER (Cron equivalent logic)
-- Expands radius and applies boosts after 90s
create or replace function apply_dispatch_boosts()
returns void
language plpgsql
security definer
as $$
begin
  -- Phase 3: Boost Mode (90s+)
  -- Apply 10% boost to payout if margin floor allows
  update orders
  set payout_bonus = payout_base * 0.10,
      boost_level = 2,
      updated_at = now()
  where status = 'pending'
    and search_started_at < now() - interval '90 seconds'
    and boost_level < 2
    and (total - (payout_base * 1.10)) >= (total * margin_floor_ratio);
end;
$$;

-- 🛡️ 6. ANTI-GAMING TRIGGER
-- If order is matched or ignored, update driver weight
-- (Simplification: we track ignored orders via "consecutive_ignored" handled in frontend ping logic)

-- 📦 7. CUSTOMER NARRATIVE View
create or replace view order_narrative as
select 
  id,
  status,
  case 
    when status = 'pending' and extract(epoch from (now() - search_started_at)) < 45 then 'Finding your golden driver...'
    when status = 'pending' and extract(epoch from (now() - search_started_at)) >= 45 and extract(epoch from (now() - search_started_at)) < 90 then 'Expanding our search zone to get you the fastest delivery...'
    when status = 'pending' and extract(epoch from (now() - search_started_at)) >= 90 then 'Applying priority boost. A driver will be with you shortly.'
    when status = 'assigned' then 'Driver found! On their way to pickup.'
    else 'Order in progress'
  end as narrative
from orders;
