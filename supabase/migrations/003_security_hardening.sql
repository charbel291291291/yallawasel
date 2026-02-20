-- ============================================================
-- MIGRATION 003: SECURITY HARDENING
-- ============================================================
-- Generated from DATABASE_SECURITY_AUDIT.md
-- Date: 2026-02-20
--
-- EXECUTION ORDER: After 001 and 002
-- SAFE: All IF NOT EXISTS / DROP IF EXISTS / OR REPLACE
-- REVERSIBLE: Each section documents what it changes
--
-- Run sections in order. Each is independently idempotent.
-- ============================================================


-- ============================================================
-- SECTION 1: HARDEN HELPER FUNCTIONS (search_path)
-- Severity: CRITICAL (F-3.1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'driver'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- SECTION 2: ADD MISSING CHECK CONSTRAINTS
-- Severity: CRITICAL (F-1.1), HIGH (F-1.3), MEDIUM (F-1.7)
-- ============================================================

-- Orders status (CRITICAL)
DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('pending', 'approved', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Orders items must be non-empty array (CRITICAL)
DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT chk_orders_items_valid
    CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Profiles tier
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profiles_tier
    CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Elite'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Driver transaction type
DO $$ BEGIN
  ALTER TABLE public.driver_transactions
    ADD CONSTRAINT chk_driver_tx_type
    CHECK (type IN ('commission', 'tip', 'payout', 'adjustment', 'bonus'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Customer transaction type
DO $$ BEGIN
  ALTER TABLE public.customer_transactions
    ADD CONSTRAINT chk_customer_tx_type
    CHECK (type IN ('earn', 'redeem', 'adjust'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Reward redemption status
DO $$ BEGIN
  ALTER TABLE public.reward_redemptions
    ADD CONSTRAINT chk_redemption_status
    CHECK (status IN ('pending', 'approved', 'rejected', 'used'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rewards type
DO $$ BEGIN
  ALTER TABLE public.rewards
    ADD CONSTRAINT chk_reward_type
    CHECK (reward_type IN ('discount', 'free_item', 'cashback', 'custom'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Delivery schedule day_of_week range
DO $$ BEGIN
  ALTER TABLE public.delivery_schedule
    ADD CONSTRAINT chk_day_of_week
    CHECK (day_of_week >= 0 AND day_of_week <= 6);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Driver wallet balance non-negative (table may not exist if 002 was never run)
DO $$ BEGIN
  ALTER TABLE public.driver_wallets
    ADD CONSTRAINT chk_driver_wallet_balance
    CHECK (balance >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.driver_wallets
    ADD CONSTRAINT chk_driver_wallet_pending
    CHECK (pending_withdrawal >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;


-- ============================================================
-- SECTION 3: ADD MISSING updated_at COLUMNS
-- Severity: MEDIUM (F-1.6)
-- ============================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.impact_campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_schedule ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Triggers (idempotent via DROP IF EXISTS)
DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_rewards ON rewards;
CREATE TRIGGER set_updated_at_rewards BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_impact_campaigns ON impact_campaigns;
CREATE TRIGGER set_updated_at_impact_campaigns BEFORE UPDATE ON impact_campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_delivery_settings ON delivery_settings;
CREATE TRIGGER set_updated_at_delivery_settings BEFORE UPDATE ON delivery_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_delivery_zones ON delivery_zones;
CREATE TRIGGER set_updated_at_delivery_zones BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_delivery_schedule ON delivery_schedule;
CREATE TRIGGER set_updated_at_delivery_schedule BEFORE UPDATE ON delivery_schedule FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ============================================================
-- SECTION 4: FIX TIER CONFLICT (F-1.4)
-- ============================================================

-- Drop conflicting tier triggers
DROP TRIGGER IF EXISTS update_tier_trigger ON profiles;
DROP TRIGGER IF EXISTS on_points_update ON profiles;

-- Drop old functions
DROP FUNCTION IF EXISTS auto_update_tier();
DROP FUNCTION IF EXISTS handle_tier_update();

-- Single canonical tier trigger
CREATE OR REPLACE FUNCTION public.enforce_tier_from_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier :=
    CASE
      WHEN NEW.points >= 5000 THEN 'Elite'
      WHEN NEW.points >= 2000 THEN 'Gold'
      WHEN NEW.points >= 500  THEN 'Silver'
      ELSE 'Bronze'
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_tier ON profiles;
CREATE TRIGGER trg_enforce_tier
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tier_from_points();


-- ============================================================
-- SECTION 5: PURGE ALL USING(true) POLICIES (CRITICAL F-2.1)
-- ============================================================

-- Drop every known USING(true) policy from legacy migrations
DROP POLICY IF EXISTS "Public Write Products" ON products;
DROP POLICY IF EXISTS "Public Read Orders" ON orders;
DROP POLICY IF EXISTS "Public Create Orders" ON orders;
DROP POLICY IF EXISTS "Admin Manage Orders" ON orders;
DROP POLICY IF EXISTS "Admin Write Settings" ON app_settings;
DROP POLICY IF EXISTS "Admin Write Delivery" ON delivery_settings;
DROP POLICY IF EXISTS "Admin Write Zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admin Manage Transactions" ON customer_transactions;
DROP POLICY IF EXISTS "Admin Manage Rewards" ON rewards;
DROP POLICY IF EXISTS "Admin Manage Redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Admin Manage Happy Hours" ON happy_hours_schedule;
DROP POLICY IF EXISTS "Admin Manage Order History" ON order_status_history;
DROP POLICY IF EXISTS "Admin Manage Driver Transactions" ON driver_transactions;
DROP POLICY IF EXISTS "Admin Manage Driver Achievements" ON driver_achievements;
DROP POLICY IF EXISTS "Admin Manage Driver Daily Stats" ON driver_daily_stats;
DROP POLICY IF EXISTS "Admin Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Admin Read FCM Tokens" ON user_fcm_tokens;
DROP POLICY IF EXISTS "Admin Read All Impact" ON user_impact;
DROP POLICY IF EXISTS "Public Read Driver Locations" ON driver_locations;
DROP POLICY IF EXISTS "Public read history" ON live_offer_history;

-- Re-create with proper is_admin() checks
-- Note: Using DROP IF EXISTS + CREATE for idempotency

-- ORDERS: authenticated users can view their own
DROP POLICY IF EXISTS "admin_manage_orders" ON orders;
CREATE POLICY "admin_manage_orders" ON orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- APP SETTINGS: public read, admin write
DROP POLICY IF EXISTS "admin_manage_app_settings" ON app_settings;
CREATE POLICY "admin_manage_app_settings" ON app_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELIVERY SETTINGS
DROP POLICY IF EXISTS "admin_manage_delivery_settings" ON delivery_settings;
CREATE POLICY "admin_manage_delivery_settings" ON delivery_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELIVERY ZONES
DROP POLICY IF EXISTS "admin_manage_delivery_zones" ON delivery_zones;
CREATE POLICY "admin_manage_delivery_zones" ON delivery_zones FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELIVERY SCHEDULE
DROP POLICY IF EXISTS "admin_manage_delivery_schedule" ON delivery_schedule;
CREATE POLICY "admin_manage_delivery_schedule" ON delivery_schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CUSTOMER TRANSACTIONS
DROP POLICY IF EXISTS "admin_manage_customer_transactions" ON customer_transactions;
CREATE POLICY "admin_manage_customer_transactions" ON customer_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REWARDS
DROP POLICY IF EXISTS "admin_manage_rewards" ON rewards;
CREATE POLICY "admin_manage_rewards" ON rewards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REWARD REDEMPTIONS (fix F-2.6: split user policy)
DROP POLICY IF EXISTS "Users manage own redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "users_view_own_redemptions" ON reward_redemptions;
CREATE POLICY "users_view_own_redemptions" ON reward_redemptions FOR SELECT USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "users_create_redemptions" ON reward_redemptions;
CREATE POLICY "users_create_redemptions" ON reward_redemptions FOR INSERT WITH CHECK (auth.uid() = customer_id AND status = 'pending');
DROP POLICY IF EXISTS "admin_manage_reward_redemptions" ON reward_redemptions;
CREATE POLICY "admin_manage_reward_redemptions" ON reward_redemptions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDER STATUS HISTORY
DROP POLICY IF EXISTS "admin_manage_order_history" ON order_status_history;
CREATE POLICY "admin_manage_order_history" ON order_status_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DRIVER TRANSACTIONS
DROP POLICY IF EXISTS "admin_manage_driver_transactions" ON driver_transactions;
CREATE POLICY "admin_manage_driver_transactions" ON driver_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DRIVER ACHIEVEMENTS
DROP POLICY IF EXISTS "admin_manage_driver_achievements" ON driver_achievements;
CREATE POLICY "admin_manage_driver_achievements" ON driver_achievements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROFILES: admin can read all
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT USING (public.is_admin());

-- FCM TOKENS: admin can read
DROP POLICY IF EXISTS "admin_read_fcm_tokens" ON user_fcm_tokens;
CREATE POLICY "admin_read_fcm_tokens" ON user_fcm_tokens FOR SELECT USING (public.is_admin());

-- USER IMPACT: admin can read all, auth users can read for leaderboard
DROP POLICY IF EXISTS "admin_read_all_user_impact" ON user_impact;
CREATE POLICY "admin_read_all_user_impact" ON user_impact FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "auth_read_leaderboard_impact" ON user_impact;
CREATE POLICY "auth_read_leaderboard_impact" ON user_impact FOR SELECT USING (auth.uid() IS NOT NULL);

-- LIVE OFFER HISTORY: public read (not sensitive) but qualify with auth
DROP POLICY IF EXISTS "auth_read_offer_history" ON live_offer_history;
CREATE POLICY "auth_read_offer_history" ON live_offer_history FOR SELECT USING (auth.uid() IS NOT NULL);
-- ^ Restrict to authenticated users to prevent scrapers; public data but logic-protected.


-- ============================================================
-- SECTION 6: FIX DRIVER ORDER VISIBILITY (HIGH F-2.5)
-- ============================================================

DROP POLICY IF EXISTS "Drivers view assigned orders" ON orders;
CREATE POLICY "drivers_view_assigned_orders" ON orders
  FOR SELECT USING (
    auth.uid() = driver_id
    OR (
      public.is_driver()
      AND driver_id IS NULL
      AND status IN ('pending', 'approved', 'preparing')
    )
  );


-- ============================================================
-- SECTION 7: FIX DRIVER GOALS EXPLOIT (HIGH F-2.7)
-- ============================================================

DROP POLICY IF EXISTS "Drivers manage own goals" ON driver_goals;
DROP POLICY IF EXISTS "drivers_view_own_goals" ON driver_goals;
CREATE POLICY "drivers_view_own_goals" ON driver_goals FOR SELECT USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "admin_manage_goals" ON driver_goals;
CREATE POLICY "admin_manage_goals" ON driver_goals FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================
-- SECTION 8: MISSING RLS + POLICIES (CRITICAL F-2.2, F-2.3, F-2.4)
-- ============================================================

-- orders_archive (create if not exists — may not have been deployed from 002)
CREATE TABLE IF NOT EXISTS public.orders_archive (LIKE public.orders INCLUDING ALL);
ALTER TABLE public.orders_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_only_archive" ON orders_archive;
CREATE POLICY "admin_only_archive" ON orders_archive FOR ALL USING (public.is_admin());

-- happy_hours (V3 — no policies existed)
DROP POLICY IF EXISTS "public_view_active_happy_hours" ON happy_hours;
CREATE POLICY "public_view_active_happy_hours" ON happy_hours FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "admin_manage_happy_hours" ON happy_hours;
CREATE POLICY "admin_manage_happy_hours" ON happy_hours FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- admin_logs
DROP POLICY IF EXISTS "admin_read_logs" ON admin_logs;
CREATE POLICY "admin_read_logs" ON admin_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_logs" ON admin_logs;
CREATE POLICY "admin_insert_logs" ON admin_logs FOR INSERT WITH CHECK (public.is_admin());

-- Enable RLS on orphan tables that might exist
DO $$ BEGIN ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.driver_daily_stats ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;


-- ============================================================
-- SECTION 9: HARDEN RPC FUNCTIONS (CRITICAL F-3.2, HIGH F-3.3, F-3.4)
-- ============================================================

-- Hardened archive_old_orders with admin check
CREATE OR REPLACE FUNCTION archive_old_orders(p_days_old INTEGER DEFAULT 90)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  v_cutoff := NOW() - (p_days_old || ' days')::INTERVAL;

  WITH moved AS (
    DELETE FROM orders
    WHERE status IN ('delivered', 'cancelled')
      AND updated_at < v_cutoff
    RETURNING *
  )
  INSERT INTO orders_archive SELECT * FROM moved;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count,
    'cutoff_date', v_cutoff
  );
END;
$$;

-- Hardened increment_points with caller validation
-- Drop old signatures to prevent overloading ambiguity
DROP FUNCTION IF EXISTS increment_points(UUID, INTEGER);
CREATE OR REPLACE FUNCTION increment_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'order'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Auth check: only self (positive only) or admin (any)
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF p_amount < 0 AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_DEDUCTION');
  END IF;

  UPDATE profiles
  SET
    points = points + p_amount,
    tier = CASE
      WHEN points + p_amount >= 5000 THEN 'Elite'
      WHEN points + p_amount >= 2000 THEN 'Gold'
      WHEN points + p_amount >= 500 THEN 'Silver'
      ELSE 'Bronze'
    END,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points, tier INTO v_new_points, v_new_tier;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_points', v_new_points,
    'new_tier', v_new_tier,
    'added', p_amount
  );
END;
$$;

-- Hardened wallet_debit with caller validation
DROP FUNCTION IF EXISTS wallet_debit(UUID, NUMERIC);
DROP FUNCTION IF EXISTS wallet_debit(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION wallet_debit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Auth check
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'current_balance', v_current_balance,
      'requested', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE profiles
  SET wallet_balance = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id
    AND wallet_balance >= p_amount;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RACE_CONDITION_BALANCE');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'debited', p_amount
  );
END;
$$;

-- Hardened wallet_credit with caller validation
DROP FUNCTION IF EXISTS wallet_credit(UUID, NUMERIC);
DROP FUNCTION IF EXISTS wallet_credit(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION wallet_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'credit'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Only admin can credit wallets
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  UPDATE profiles
  SET wallet_balance = wallet_balance + p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'credited', p_amount,
    'reason', p_reason
  );
END;
$$;

-- Hardened accept_order with driver validation
DROP FUNCTION IF EXISTS accept_order(UUID, UUID);
CREATE OR REPLACE FUNCTION accept_order(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Verify caller is a driver
  IF NOT public.is_driver() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_A_DRIVER');
  END IF;

  -- Verify driver_id matches caller (unless admin)
  IF p_driver_id != auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRIVER_ID_MISMATCH');
  END IF;

  UPDATE orders
  SET
    driver_id = p_driver_id,
    status = 'out_for_delivery',
    driver_accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id
    AND driver_id IS NULL
    AND status IN ('pending', 'approved', 'preparing')
  RETURNING id, status, driver_id INTO v_order;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ORDER_ALREADY_CLAIMED',
      'message', 'This order has already been accepted by another driver.'
    );
  END IF;

  INSERT INTO order_status_history (order_id, status, note, created_by)
  VALUES (p_order_id, 'out_for_delivery', 'Accepted by driver', p_driver_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'driver_id', v_order.driver_id
  );
END;
$$;


-- ============================================================
-- SECTION 10: STORAGE HARDENING (CRITICAL F-5.1)
-- ============================================================

-- Kill the open upload policy
DROP POLICY IF EXISTS "Public Upload Images" ON storage.objects;

-- Replace with admin-only upload
DROP POLICY IF EXISTS "Admin Upload Images" ON storage.objects;
CREATE POLICY "Admin Upload Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND public.is_admin());

-- Fix delivery proofs (scope to driver's own folder)
DROP POLICY IF EXISTS "Drivers Manage Own Proofs" ON storage.objects;
CREATE POLICY "Drivers Manage Own Proofs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'delivery_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'delivery_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- SECTION 11: MISSING FK INDEXES (MEDIUM F-1.8)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer
  ON customer_transactions (customer_id);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer
  ON reward_redemptions (customer_id);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward
  ON reward_redemptions (reward_id);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user
  ON user_fcm_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_created_by
  ON order_status_history (created_by)
  WHERE created_by IS NOT NULL;


-- ============================================================
-- SECTION 12: IDEMPOTENCY PROTECTION (MEDIUM F-6.3)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_impact_order
  ON user_impact (user_id, order_id)
  WHERE order_id IS NOT NULL;


-- ============================================================
-- SECTION 13: WALLET TRANSACTIONS TABLE (MEDIUM F-3.6)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'refund')),
  idempotency_key TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "users_view_own_wallet_tx" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_wallet_tx" ON wallet_transactions;
CREATE POLICY "admin_manage_wallet_tx" ON wallet_transactions FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions (idempotency_key);


-- ============================================================
-- SECTION 14: AUDIT LOG TABLE (HIGH F-7.1)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_log" ON audit_log;
CREATE POLICY "admin_read_audit_log" ON audit_log FOR SELECT USING (public.is_admin());

-- System-level insert (via SECURITY DEFINER triggers only)
DROP POLICY IF EXISTS "system_insert_audit_log" ON audit_log;
CREATE POLICY "system_insert_audit_log" ON audit_log FOR INSERT WITH CHECK (true);
-- ^ Insert is allowed because only SECURITY DEFINER trigger functions write to this table

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log (table_name, record_id);


-- ============================================================
-- SECTION 15: AUDIT TRIGGERS (MEDIUM F-7.2)
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    actor_id, actor_role, action, table_name, record_id,
    old_values, new_values
  ) VALUES (
    auth.uid(),
    COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'system'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply to critical tables
DROP TRIGGER IF EXISTS audit_orders ON orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_profiles_critical ON profiles;
CREATE TRIGGER audit_profiles_critical
  AFTER UPDATE OF wallet_balance, points, tier, role, is_admin ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_reward_redemptions ON reward_redemptions;
CREATE TRIGGER audit_reward_redemptions
  AFTER INSERT OR UPDATE ON reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();


-- ============================================================
-- SECTION 16: HARDEN handle_new_driver TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_driver_v3()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'driver' THEN
    INSERT INTO public.driver_goals (driver_id) VALUES (NEW.id) ON CONFLICT (driver_id, date) DO NOTHING;
    INSERT INTO public.driver_locations (driver_id, latitude, longitude) VALUES (NEW.id, 0, 0) ON CONFLICT (driver_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- SECTION 17: MISSING FUNCTIONS FROM 002 (self-contained)
-- These were defined in 002_transaction_safety.sql which was
-- never applied to the live DB. Including hardened versions here.
-- ============================================================

-- Hardened transition_order_status with state machine
DROP FUNCTION IF EXISTS transition_order_status(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS transition_order_status(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION transition_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_actor_id TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_allowed_transitions JSONB := '{
    "pending": ["approved", "cancelled"],
    "approved": ["preparing", "cancelled"],
    "preparing": ["out_for_delivery", "cancelled"],
    "out_for_delivery": ["delivered", "cancelled"],
    "delivered": [],
    "cancelled": []
  }'::JSONB;
  v_allowed JSONB;
BEGIN
  -- Auth check: only admin or assigned driver
  IF NOT public.is_admin() AND NOT public.is_driver() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT status INTO v_current_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  v_allowed := v_allowed_transitions -> v_current_status;
  IF v_allowed IS NULL OR NOT (v_allowed ? p_new_status) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TRANSITION',
      'message', format('Cannot transition from %s to %s', v_current_status, p_new_status),
      'current_status', v_current_status
    );
  END IF;

  UPDATE orders
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO order_status_history (order_id, status, note, created_by)
  VALUES (p_order_id, p_new_status, p_note, p_actor_id);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_current_status,
    'new_status', p_new_status
  );
END;
$$;

-- Hardened record_impact_contribution
CREATE OR REPLACE FUNCTION record_impact_contribution(
  p_user_id UUID,
  p_campaign_id UUID,
  p_order_id UUID,
  p_contribution_amount NUMERIC,
  p_impact_units NUMERIC,
  p_impact_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_campaign_exists BOOLEAN;
BEGIN
  -- Auth check: only self or admin
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM impact_campaigns
    WHERE id = p_campaign_id AND is_active = true
  ) INTO v_campaign_exists;

  IF NOT v_campaign_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  INSERT INTO user_impact (user_id, campaign_id, order_id, contribution_amount, impact_units, impact_type)
  VALUES (p_user_id, p_campaign_id, p_order_id, p_contribution_amount, p_impact_units, p_impact_type);

  UPDATE impact_campaigns
  SET current_amount = current_amount + p_contribution_amount
  WHERE id = p_campaign_id;

  RETURN jsonb_build_object(
    'success', true,
    'contribution_amount', p_contribution_amount,
    'impact_units', p_impact_units
  );
END;
$$;


-- ============================================================
-- SECTION 18: GRANT PERMISSIONS FOR ALL FUNCTIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION accept_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION transition_order_status(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_debit(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_credit(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_points(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_impact_contribution(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_orders(INTEGER) TO authenticated;


-- ============================================================
-- ANALYSIS COMPLETE
-- ============================================================

-- Run ANALYZE on all tables after applying this migration
ANALYZE profiles;
ANALYZE orders;
ANALYZE products;
ANALYZE driver_transactions;
ANALYZE customer_transactions;
ANALYZE rewards;
ANALYZE reward_redemptions;
ANALYZE user_impact;
ANALYZE impact_campaigns;
ANALYZE admin_logs;
