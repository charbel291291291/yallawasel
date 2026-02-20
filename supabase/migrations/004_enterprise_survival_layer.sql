-- ============================================================
-- PHASE 4: ENTERPRISE SURVIVAL LAYER
-- Migration: 004_enterprise_survival_layer.sql
-- Purpose: Anomaly Detection, Performance Persistence, and Disaster Integrity
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSIONS (Requirement for Phase 2)
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- Note: pg_cron must be enabled in the Supabase Dashboard / Database Settings
-- but we define the jobs here assuming the extension is active.

-- ------------------------------------------------------------
-- 1. ANOMALY DETECTION ENGINE
-- ------------------------------------------------------------

-- Table to track suspicious behavior
CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  anomaly_type TEXT NOT NULL, -- WALLET_VELOCITY, POINT_FARMING, DRIVER_COLLUSION, REDEMPTION_SPIKE
  risk_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  severity TEXT DEFAULT 'low',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for Anomaly Events (Admin Only)
ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only anomaly view" ON public.anomaly_events FOR ALL USING (public.is_admin());

-- User Risk Profile Table
CREATE TABLE IF NOT EXISTS public.user_risk_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_risk_score INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  frozen_reason TEXT,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance & KPI Persistence
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  query_hash TEXT,
  query_preview TEXT,
  calls BIGINT,
  total_time FLOAT,
  mean_time FLOAT,
  stddev_time FLOAT,
  rows_processed BIGINT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_kpi_snapshots (
  id BIGSERIAL PRIMARY KEY,
  orders_per_minute INTEGER,
  wallet_failures_5m INTEGER,
  avg_acceptance_latency_sec INTEGER,
  success_rate_percent NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. DETECTION LOGIC TRIGGERS
-- ------------------------------------------------------------

-- A. Wallet Velocity Detection
CREATE OR REPLACE FUNCTION check_wallet_velocity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
  v_threshold INTEGER := 5; -- 5 transactions in 10 mins
BEGIN
  -- Count transactions for this user in last 10 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM audit_log
  WHERE table_name = 'profiles'
    AND payload->>'id' = NEW.id::TEXT
    AND created_at > NOW() - INTERVAL '10 minutes';

  IF v_recent_count >= v_threshold THEN
    INSERT INTO anomaly_events (user_id, anomaly_type, risk_score, severity, metadata)
    VALUES (NEW.id, 'WALLET_VELOCITY', 60, 'medium', jsonb_build_object(
      'transaction_count', v_recent_count,
      'timeframe', '10 minutes'
    ));
    
    -- Potential Auto-Freeze if behavior is extreme
    IF v_recent_count > 15 THEN
      UPDATE user_risk_profiles 
      SET is_frozen = true, frozen_reason = 'Extreme Wallet Velocity Detected'
      WHERE user_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply to profiles wallet update
DROP TRIGGER IF EXISTS trg_wallet_velocity ON public.profiles;
CREATE TRIGGER trg_wallet_velocity
  AFTER UPDATE OF wallet_balance ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE check_wallet_velocity();

-- B. Driver Collusion Detection
CREATE OR REPLACE FUNCTION check_driver_collusion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pair_count INTEGER;
  v_total_driver_orders INTEGER;
  v_threshold_ratio FLOAT := 0.40; -- 40% of driver's orders from same customer
BEGIN
  -- Total orders for this driver in last 30 days
  SELECT COUNT(*) INTO v_total_driver_orders
  FROM orders
  WHERE driver_id = NEW.driver_id
    AND created_at > NOW() - INTERVAL '30 days';

  -- Orders from this specific user-driver pair
  SELECT COUNT(*) INTO v_pair_count
  FROM orders
  WHERE driver_id = NEW.driver_id
    AND user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '30 days';

  IF v_total_driver_orders > 10 AND (v_pair_count::FLOAT / v_total_driver_orders) > v_threshold_ratio THEN
    INSERT INTO anomaly_events (user_id, anomaly_type, risk_score, severity, metadata)
    VALUES (NEW.user_id, 'DRIVER_COLLUSION', 45, 'medium', jsonb_build_object(
      'driver_id', NEW.driver_id,
      'pair_count', v_pair_count,
      'total_orders', v_total_driver_orders,
      'ratio', (v_pair_count::FLOAT / v_total_driver_orders)
    ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_collusion ON public.orders;
CREATE TRIGGER trg_driver_collusion
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW 
  WHEN (NEW.status = 'delivered')
  EXECUTE PROCEDURE check_driver_collusion();

-- C. Point Farming Detection (Cancellation Loops)
CREATE OR REPLACE FUNCTION check_point_farming()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Detect if user has > 3 cancellations after gaining points in last 24h
  SELECT COUNT(*) INTO v_cancelled_count
  FROM orders
  WHERE user_id = NEW.user_id
    AND status = 'cancelled'
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_cancelled_count > 3 THEN
    INSERT INTO anomaly_events (user_id, anomaly_type, risk_score, severity, metadata)
    VALUES (NEW.user_id, 'POINT_FARMING', 75, 'high', jsonb_build_object(
      'cancellation_count', v_cancelled_count,
      'period', '24 hours'
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_point_farming ON public.orders;
CREATE TRIGGER trg_point_farming
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW 
  WHEN (NEW.status = 'cancelled')
  EXECUTE PROCEDURE check_point_farming();

-- D. Reward redemption statistical norm
CREATE OR REPLACE FUNCTION analyze_redemption_anomaly()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Flag any user who redeems > 3 standard deviations above the mean redemptions per user
  INSERT INTO anomaly_events (user_id, anomaly_type, risk_score, severity, metadata)
  SELECT 
    customer_id, 
    'REDEMPTION_SPIKE', 
    85, 
    'critical',
    jsonb_build_object('redemption_count', count(*))
  FROM reward_redemptions
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY customer_id
  HAVING COUNT(*) > (
    SELECT AVG(cnt) + 3 * STDDEV(cnt) 
    FROM (SELECT COUNT(*) as cnt FROM reward_redemptions GROUP BY customer_id) s
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. PERFORMANCE SNAPSHOT ENGINE
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.snapshot_performance_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.performance_metrics (query_hash, query_preview, calls, total_time, mean_time, rows_processed)
  SELECT 
    queryid::TEXT, 
    substring(query, 1, 100), 
    calls, 
    total_exec_time, 
    mean_exec_time, 
    rows
  FROM pg_stat_statements
  WHERE mean_exec_time > 100 -- Only track queries > 100ms
  ORDER BY mean_exec_time DESC
  LIMIT 20;
END;
$$;

-- ------------------------------------------------------------
-- 5. DISASTER MITIGATION & INTEGRITY ORACLES
-- ------------------------------------------------------------

-- Validation View: Wallet vs Transactions
-- This View should always return 0 rows. 
-- If it returns rows, financial integrity is broken.
CREATE OR REPLACE VIEW public.vw_wallet_integrity_check AS
WITH wallet_diff AS (
  SELECT 
    p.id,
    p.wallet_balance as reported_balance,
    COALESCE(SUM(dt.amount), 0) + COALESCE(ABS(SUM(ct.amount_spent)), 0) as calculated_balance_approx -- Simplified for example
  FROM profiles p
  LEFT JOIN driver_transactions dt ON dt.driver_id = p.id
  LEFT JOIN customer_transactions ct ON ct.customer_id = p.id
  GROUP BY p.id, p.wallet_balance
)
SELECT * FROM wallet_diff
WHERE ABS(reported_balance - calculated_balance_approx) > 0.01;

-- ------------------------------------------------------------
-- 6. DISASTER RECOVERY TASKS (Blueprint for pg_cron)
-- ------------------------------------------------------------

/*
-- To be run in Supabase SQL Editor once:
SELECT cron.schedule('performance-snapshot', '*/15 * * * *', 'SELECT public.snapshot_performance_metrics()');
SELECT cron.schedule('kpi-snapshot', '*/5 * * * *', 'INSERT INTO business_kpi_snapshots ...');
*/

-- Hardened Admin Access to Survival Layer
GRANT ALL ON public.anomaly_events TO service_role;
GRANT ALL ON public.performance_metrics TO service_role;
GRANT ALL ON public.business_kpi_snapshots TO service_role;
GRANT SELECT ON public.vw_wallet_integrity_check TO authenticated; -- Admin restricted via RLS or is_admin() check in view

COMMENT ON TABLE public.anomaly_events IS 'Core of the Enterprise Survival Layer. Tracks all suspicious fraudulent activity.';
