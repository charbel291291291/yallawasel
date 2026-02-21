-- 🛰️ FLEET MANAGEMENT SYSTEM - BACKEND HARDENING
-- Phase 0: Infrastructure Prep (Ensure missing tables exist)

-- 0. ENABLE GEOSPATIAL SUPPORT
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Driver Wallet System
CREATE TABLE IF NOT EXISTS public.driver_wallets (
    id UUID REFERENCES public.drivers(id) ON DELETE CASCADE PRIMARY KEY,
    balance DECIMAL(12,2) DEFAULT 0.00,
    today_earnings DECIMAL(12,2) DEFAULT 0.00,
    pending_payouts DECIMAL(12,2) DEFAULT 0.00,
    last_payout_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Wallet Transactions Archive
CREATE TABLE IF NOT EXISTS public.driver_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('payout', 'bonus', 'withdrawal', 'adjustment')),
    description TEXT,
    surge_bonus DECIMAL(12,2) DEFAULT 0,
    streak_bonus DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Demand Zones (Surge Management)
CREATE TABLE IF NOT EXISTS public.demand_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    polygon GEOMETRY(Polygon, 4326),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    heat_level TEXT DEFAULT 'low' CHECK (heat_level IN ('low', 'medium', 'high')),
    active_orders_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Realtime for Fleet Components
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'driver_wallets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_wallets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'driver_transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_transactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'demand_zones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_zones;
  END IF;
END $$;

-- Phase 1: Security & RBAC Expansion

-- 1. Expand Role Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('customer', 'driver', 'admin', 'fleet_manager'));

ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_zones ENABLE ROW LEVEL SECURITY;

-- 2. Fleet Manager RLS Policies
-- Drivers
DROP POLICY IF EXISTS "Fleet managers can view all drivers" ON public.drivers;
CREATE POLICY "Fleet managers can view all drivers"
ON public.drivers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'fleet_manager' OR profiles.role = 'admin')
  )
);

-- Orders
DROP POLICY IF EXISTS "Fleet managers can view all orders" ON public.orders;
CREATE POLICY "Fleet managers can view all orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'fleet_manager' OR profiles.role = 'admin')
  )
);

-- Wallets
DROP POLICY IF EXISTS "Fleet managers can view driver wallets" ON public.driver_wallets;
CREATE POLICY "Fleet managers can view driver wallets"
ON public.driver_wallets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'fleet_manager' OR profiles.role = 'admin')
  )
);

-- Transactions
DROP POLICY IF EXISTS "Fleet managers can view driver transactions" ON public.driver_transactions;
CREATE POLICY "Fleet managers can view driver transactions"
ON public.driver_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'fleet_manager' OR profiles.role = 'admin')
  )
);

-- Surge Zones (Demand Zones)
DROP POLICY IF EXISTS "Fleet managers can manage demand zones" ON public.demand_zones;
CREATE POLICY "Fleet managers can manage demand zones"
ON public.demand_zones FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'fleet_manager' OR profiles.role = 'admin')
  )
);

-- 3. Fleet Intelligence Views
CREATE OR REPLACE VIEW public.fleet_kpis AS
SELECT
    (SELECT COUNT(*) FROM public.drivers WHERE is_online = true) as online_drivers,
    (SELECT COUNT(*) FROM public.drivers WHERE is_online = true AND last_seen > now() - interval '5 minutes') as active_drivers,
    (SELECT COUNT(*) FROM public.orders WHERE status IN ('assigned', 'accepted', 'picked_up')) as active_missions,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered' AND created_at > current_date) as completed_today,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status = 'delivered' AND created_at > current_date) as revenue_today,
    (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60), 0) FROM public.orders WHERE status = 'delivered' AND created_at > current_date) as avg_delivery_time;

-- 4. Revenue by Driver RPC
CREATE OR REPLACE FUNCTION public.get_fleet_revenue_by_driver(days_limit int DEFAULT 30)
RETURNS TABLE (driver_name text, total_revenue numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.full_name AS driver_name, SUM(o.total) AS total_revenue
    FROM public.orders o
    JOIN public.profiles p ON o.driver_id = p.id
    WHERE o.status = 'delivered'
      AND o.created_at > now() - (days_limit || ' days')::interval
    GROUP BY p.full_name
    ORDER BY 2 DESC;
$$;
