
-- ========================================================
-- LIVE BREAKING CHART MODULE
-- ========================================================

-- 1. Chart Settings (Admin Config)
create table if not exists public.chart_settings (
  id integer primary key default 1,
  -- Colors
  primary_color text default '#10b981',
  positive_color text default '#10b981',
  negative_color text default '#ef4444',
  background_color text default '#ffffff',
  grid_color text default '#e5e7eb',
  text_color text default '#374151',
  tooltip_bg_color text default '#1f2937',
  
  -- Visuals
  line_thickness integer default 3 check (line_thickness >= 1 and line_thickness <= 10),
  animation_speed integer default 1000 check (animation_speed >= 100), -- in ms
  show_smooth_curves boolean default true,
  show_shadow_glow boolean default true,
  dark_mode_enabled boolean default false,
  rounded_edges boolean default true,
  
  -- Data Control
  time_range text default '24h' check (time_range in ('1h', '6h', '24h', '7d')),
  refresh_interval integer default 5000 check (refresh_interval >= 1000),
  max_data_points integer default 50 check (max_data_points >= 10),
  realtime_enabled boolean default true,
  
  updated_at timestamp with time zone default now(),
  constraint single_row_chart check (id = 1)
);

-- RLS
alter table public.chart_settings enable row level security;
create policy "Public read chart settings" on public.chart_settings for select using (true);
create policy "Admin update chart settings" on public.chart_settings for all using (public.is_admin());

-- Insert default settings
insert into public.chart_settings (id) values (1) on conflict (id) do nothing;

-- 2. Live Offers (Data Source)
create table if not exists public.live_offers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  current_price numeric not null check (current_price >= 0),
  status text default 'active' check (status in ('active', 'inactive', 'sold_out')),
  movement text default 'neutral' check (movement in ('up', 'down', 'neutral')), -- calculated trigger
  popularity_score integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS
alter table public.live_offers enable row level security;
create policy "Public read live offers" on public.live_offers for select using (status = 'active');
create policy "Admin manage live offers" on public.live_offers for all using (public.is_admin());

-- 3. Offer History (For Charts)
create table if not exists public.live_offer_history (
  id uuid default gen_random_uuid() primary key,
  offer_id uuid references public.live_offers(id) on delete cascade not null,
  price numeric not null,
  recorded_at timestamp with time zone default now()
);

-- RLS
alter table public.live_offer_history enable row level security;
create policy "Public read history" on public.live_offer_history for select using (true);
create policy "Admin manage history" on public.live_offer_history for all using (public.is_admin());


-- 4. Triggers
-- Auto-record history on price change
create or replace function public.record_offer_history()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') or (new.current_price <> old.current_price) then
    -- Insert history record
    insert into public.live_offer_history (offer_id, price, recorded_at)
    values (new.id, new.current_price, now());
    
    -- Update movement direction
    if (TG_OP = 'UPDATE') then
      if new.current_price > old.current_price then
        new.movement = 'up';
      elsif new.current_price < old.current_price then
        new.movement = 'down';
      else
        new.movement = 'neutral';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_offer_price_change
  before insert or update of current_price on public.live_offers
  for each row execute procedure public.record_offer_history();

-- Updated At
create trigger set_chart_updated_at before update on public.chart_settings for each row execute procedure public.handle_updated_at();

-- Seed some initial data if empty
do $$
begin
  if not exists (select 1 from public.live_offers) then
    insert into public.live_offers (title, current_price, status)
    values 
      ('Gold Tier Membership', 150.00, 'active'),
      ('Silver Tier Membership', 50.00, 'active'),
      ('VIP Delivery Pass', 25.00, 'active');
  end if;
end;
$$;
