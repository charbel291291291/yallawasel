-- PROD-GRADE DRIVER ECOSYSTEM EXTENSION
-- High-Performance Wallet, Tier, and Surge Infrastructure

-- 1. EXTEND DRIVER PROFILE / STATS
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
ADD COLUMN IF NOT EXISTS total_online_hours float DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS language_pref text DEFAULT 'en' CHECK (language_pref IN ('en', 'ar'));

-- 2. DRIVER WALLET SYSTEM
CREATE TABLE IF NOT EXISTS public.driver_wallets (
    id uuid REFERENCES public.drivers(id) ON DELETE CASCADE PRIMARY KEY,
    balance decimal(12,2) DEFAULT 0.00,
    today_earnings decimal(12,2) DEFAULT 0.00,
    pending_payouts decimal(12,2) DEFAULT 0.00,
    last_payout_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. WALLET TRANSACTIONS ARCHIVE
CREATE TABLE IF NOT EXISTS public.driver_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    amount decimal(12,2) NOT NULL,
    type text CHECK (type IN ('payout', 'bonus', 'withdrawal', 'adjustment')),
    description text,
    surge_bonus decimal(12,2) DEFAULT 0,
    streak_bonus decimal(12,2) DEFAULT 0,
    status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at timestamp with time zone DEFAULT now()
);

-- 4. REAL-TIME SURGE & DEMAND MAPPING
CREATE TABLE IF NOT EXISTS public.demand_zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text,
    polygon geometry(Polygon, 4326),
    surge_multiplier decimal(3,2) DEFAULT 1.0,
    heat_level text DEFAULT 'low' CHECK (heat_level IN ('low', 'medium', 'high')),
    active_orders_count integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. ATOMIC MISSION COMPLETION & PAYOUT RPC
CREATE OR REPLACE FUNCTION public.complete_mission_with_payout(
    p_order_id uuid,
    p_driver_id uuid,
    p_base_payout decimal,
    p_bonus_payout decimal,
    p_surge_multiplier decimal
) RETURNS void AS $$
DECLARE
    v_total decimal;
BEGIN
    v_total := (p_base_payout * p_surge_multiplier) + p_bonus_payout;

    -- 1. Update Order Status
    UPDATE public.orders 
    SET status = 'delivered',
        updated_at = now()
    WHERE id = p_order_id AND driver_id = p_driver_id;

    -- 2. Update Driver Stats
    UPDATE public.drivers
    SET completed_deliveries = completed_deliveries + 1,
        daily_earnings = daily_earnings + v_total,
        current_streak = current_streak + 1,
        last_seen = now()
    WHERE id = p_driver_id;

    -- 3. Update/Insert Wallet
    INSERT INTO public.driver_wallets (id, balance, today_earnings)
    VALUES (p_driver_id, v_total, v_total)
    ON CONFLICT (id) DO UPDATE 
    SET balance = public.driver_wallets.balance + EXCLUDED.balance,
        today_earnings = public.driver_wallets.today_earnings + EXCLUDED.today_earnings,
        updated_at = now();

    -- 4. Archive Transaction
    INSERT INTO public.driver_transactions (driver_id, order_id, amount, type, description, surge_bonus)
    VALUES (p_driver_id, p_order_id, v_total, 'payout', 'Mission #' || substring(p_order_id::text, 1, 8) || ' completion', p_bonus_payout);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_zones;

-- 7. RLS POLICIES
ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own wallet" ON public.driver_wallets
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Drivers can view their own transactions" ON public.driver_transactions
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Everyone can view demand zones" ON public.demand_zones
    FOR SELECT USING (true);
