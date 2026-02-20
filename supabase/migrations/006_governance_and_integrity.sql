-- ============================================================
-- PHASE 6: GOVERNANCE, INTEGRITY & PRE-DEPLOY LOCKDOWN
-- Migration: 006_governance_and_integrity.sql
-- Purpose: Advanced Risk Decay, Integrity Oracles, and Security Auditing
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADAPTIVE RISK DECAY (PHASE 1)
-- ------------------------------------------------------------

-- Add decay_factor if missing
ALTER TABLE public.anomaly_events ADD COLUMN IF NOT EXISTS decay_factor NUMERIC DEFAULT 1.0;

-- Function to calculate decayed risk score
-- Formula: risk_score * (0.5 ^ (days_since_created / 7))  [7 day half-life]
CREATE OR REPLACE FUNCTION public.get_decayed_risk_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_decayed_total NUMERIC := 0;
BEGIN
  SELECT SUM(
    risk_score * power(0.5, extract(day from (NOW() - created_at)) / 7.0)
  ) INTO v_decayed_total
  FROM public.anomaly_events
  WHERE user_id = p_user_id
    AND status = 'open'
    AND created_at > (NOW() - INTERVAL '30 days');

  RETURN COALESCE(v_decayed_total, 0)::INTEGER;
END;
$$;

-- ------------------------------------------------------------
-- 2. WALLET INTEGRITY ORACLE (PHASE 3)
-- ------------------------------------------------------------

-- Comprehensive Integrity Oracle
CREATE OR REPLACE FUNCTION public.run_wallet_integrity_check()
RETURNS TABLE (
  mismatch_count BIGINT,
  total_discrepancy NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*),
    SUM(ABS(reported_balance - calculated_balance_approx))
  FROM public.vw_wallet_integrity_check;
END;
$$;

-- ------------------------------------------------------------
-- 3. PRE-DEPLOY SECURITY AUDIT SUITE (PHASE 5)
-- ------------------------------------------------------------

/*
  EXECUTE THESE QUERIES BEFORE EVERY DEPLOY.
  Any row returned = CRITICAL SECURITY RISK.
*/

-- A. Detect overly permissive policies (USING true / CHECK true)
CREATE OR REPLACE VIEW public.audit_unsecured_policies AS
SELECT 
  schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = '(true)' OR with_check = '(true)');

-- B. Detect tables with RLS disabled
CREATE OR REPLACE VIEW public.audit_disabled_rls AS
SELECT 
  schemaname, tablename, relrowsecurity
FROM pg_catalog.pg_tables t
JOIN pg_catalog.pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public'
  AND relrowsecurity = false;

-- C. Detect Security Definer functions without search_path
CREATE OR REPLACE VIEW public.audit_unsafe_functions AS
SELECT 
  proname, proargtypes, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prosecdef = true
  AND (proconfig IS NULL OR NOT (proconfig @> ARRAY['search_path=public']));

-- D. Detect Missing Indexes on Foreign Keys (Performance Risk)
CREATE OR REPLACE VIEW public.audit_missing_fk_indexes AS
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE confrelid != 0 
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i 
    WHERE i.indrelid = c.conrelid 
      AND i.indkey[0] = a.attnum
  );

-- ------------------------------------------------------------
-- 4. ADAPTIVE BASELINE LOGIC (PHASE 1.4)
-- ------------------------------------------------------------

-- Table to store user baselines (Aggregated monthly)
CREATE TABLE IF NOT EXISTS public.user_activity_baselines (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  avg_daily_tx_count NUMERIC,
  max_daily_tx_count INTEGER,
  last_computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.compute_user_baselines()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_baselines (user_id, avg_daily_tx_count, max_daily_tx_count, last_computed_at)
  SELECT 
    actor_id,
    COUNT(*) / 30.0,
    MAX(daily_count),
    NOW()
  FROM (
    SELECT actor_id, date_trunc('day', created_at), COUNT(*) as daily_count
    FROM audit_log
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY 1, 2
  ) s
  GROUP BY actor_id
  ON CONFLICT (user_id) DO UPDATE SET
    avg_daily_tx_count = EXCLUDED.avg_daily_tx_count,
    max_daily_tx_count = EXCLUDED.max_daily_tx_count,
    last_computed_at = NOW();
END;
$$;

-- ------------------------------------------------------------
-- 5. THE SURVIVAL GUARD (Final Shield)
-- ------------------------------------------------------------

-- Global Throttling Policy based on Adaptive Thresholds
CREATE OR REPLACE FUNCTION public.enforce_adaptive_shield(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_baseline INTEGER;
  v_current_10m INTEGER;
BEGIN
  -- Get user's max daily baseline / 2 (Safe burst limit for 10m)
  SELECT COALESCE(max_daily_tx_count, 10) INTO v_baseline 
  FROM user_activity_baselines WHERE user_id = p_user_id;

  -- Get current 10m activity
  SELECT COUNT(*) INTO v_current_10m
  FROM audit_log
  WHERE actor_id = p_user_id AND created_at > NOW() - INTERVAL '10 minutes';

  -- If user exceeds their own normal burst by 3x, throttle
  IF v_current_10m > (v_baseline * 3) THEN
    RAISE EXCEPTION 'ADAPTIVE_SHIELD_TRIGGERED' USING DETAIL = 'Unusual burst activity detected for your profile.';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 6. DISASTER RECOVERY INTEGRITY DRILL
-- ------------------------------------------------------------

/*
  AFTER RESTORE, RUN THIS:
  SELECT * FROM public.run_full_integrity_drill();
*/
CREATE OR REPLACE FUNCTION public.run_full_integrity_drill()
RETURNS TABLE (test_name TEXT, status TEXT, details TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Test 1: Wallet Integrity
  RETURN QUERY SELECT 'Wallet Balance Sync'::TEXT, 
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('%L mismatches found', COUNT(*))::TEXT
    FROM public.vw_wallet_integrity_check;

  -- Test 2: RLS Status
  RETURN QUERY SELECT 'RLS Enabled All'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('%L tables without RLS', COUNT(*))::TEXT
    FROM public.audit_disabled_rls;

  -- Test 3: Safe Functions
  RETURN QUERY SELECT 'Search Path Hardening'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('%L unsafe functions found', COUNT(*))::TEXT
    FROM public.audit_unsafe_functions;
END;
$$;

GRANT EXECUTE ON FUNCTION run_full_integrity_drill() TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;

COMMENT ON VIEW public.audit_unsecured_policies IS 'Pre-deploy check: Detects USING(true) or WITH CHECK(true) policies.';
COMMENT ON FUNCTION public.get_decayed_risk_score IS 'Calculates survival risk using a 7-day half-life decay model.';
