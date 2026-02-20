-- ============================================================
-- PHASE 5: ADVANCED VELOCITY DETECTION & ANTI-FRAUD
-- Migration: 005_velocity_protection.sql
-- Purpose: Per-User and Per-IP Velocity Throttling
-- ============================================================

-- ------------------------------------------------------------
-- 0. IP & AGENT TRACKING HELPERS
-- ------------------------------------------------------------

-- Helper to extract client IP from Supabase request headers
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS INET AS $$
DECLARE
  v_headers JSONB;
  v_ip TEXT;
BEGIN
  v_headers := current_setting('request.headers', true)::jsonb;
  IF v_headers IS NULL THEN
    RETURN '127.0.0.1'::INET;
  END IF;
  
  v_ip := split_part(v_headers->>'x-forwarded-for', ',', 1);
  IF v_ip = '' OR v_ip IS NULL THEN
    RETURN '127.0.0.1'::INET;
  END IF;
  
  RETURN v_ip::INET;
EXCEPTION WHEN OTHERS THEN
  RETURN '127.0.0.1'::INET;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- 1. DATA MODEL HARDENING
-- ------------------------------------------------------------

-- Ensure core tables exist (Self-contained dependency)
CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  anomaly_type TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  severity TEXT DEFAULT 'low',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.user_risk_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_risk_score INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  frozen_reason TEXT,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admin only anomaly view" ON public.anomaly_events FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add IP and UserAgent tracking to all transaction logs
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

ALTER TABLE public.customer_transactions ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.customer_transactions ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

ALTER TABLE public.driver_transactions ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.driver_transactions ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;

-- Update Anomaly Events from 004
ALTER TABLE public.anomaly_events ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.anomaly_events ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;
ALTER TABLE public.anomaly_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'; -- open, auto_mitigated, reviewed

-- ------------------------------------------------------------
-- 2. PERFORMANCE INDEXING (PHASE 1)
-- ------------------------------------------------------------

-- Index for User Velocity (last 10 mins)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_recent 
  ON public.audit_log (actor_id, created_at DESC);

-- Index for IP Velocity
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_recent 
  ON public.audit_log (ip_address, created_at DESC);

-- Partial index for open anomalies
CREATE INDEX IF NOT EXISTS idx_anomaly_events_open 
  ON public.anomaly_events (user_id) 
  WHERE status = 'open';

-- ------------------------------------------------------------
-- 3. RISK SCORING ENGINE (PHASE 3)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_user_risk_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_score INTEGER := 0;
  v_recent_anomaly_count INTEGER;
  v_repeat_multiplier NUMERIC := 1.0;
BEGIN
  -- 1. Base score from open anomalies
  SELECT COALESCE(SUM(risk_score), 0) INTO v_total_score
  FROM public.anomaly_events
  WHERE user_id = p_user_id
    AND status = 'open'
    AND created_at > (NOW() - INTERVAL '24 hours');

  -- 2. Repeat offense multiplier
  SELECT COUNT(*) INTO v_recent_anomaly_count
  FROM public.anomaly_events
  WHERE user_id = p_user_id
    AND created_at > (NOW() - INTERVAL '7 days');

  IF v_recent_anomaly_count > 5 THEN
    v_repeat_multiplier := 1.5;
  ELSIF v_recent_anomaly_count > 10 THEN
    v_repeat_multiplier := 2.0;
  END IF;

  RETURN (v_total_score * v_repeat_multiplier)::INTEGER;
END;
$$;

-- ------------------------------------------------------------
-- 4. VELOCITY LOGIC (PHASE 2)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.detect_and_log_velocity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_tx_count INTEGER;
  v_ip_user_count INTEGER;
  v_current_ip INET;
BEGIN
  v_current_ip := public.get_client_ip();
  
  -- NEW Transaction Velocity (User)
  SELECT COUNT(*) INTO v_user_tx_count
  FROM audit_log
  WHERE actor_id = auth.uid()
    AND table_name = TG_TABLE_NAME
    AND action = 'UPDATE'
    AND created_at > (NOW() - INTERVAL '10 minutes');

  -- IP Correlation (Unique users from same IP)
  SELECT COUNT(DISTINCT actor_id) INTO v_ip_user_count
  FROM audit_log
  WHERE ip_address = v_current_ip
    AND created_at > (NOW() - INTERVAL '10 minutes');

  -- RULE 1: User Velocity
  IF v_user_tx_count > 15 THEN
    INSERT INTO anomaly_events (user_id, ip_address, anomaly_type, risk_score, severity, metadata)
    VALUES (auth.uid(), v_current_ip, 'USER_VELOCITY_HIGH', 60, 'high', 
      jsonb_build_object('tx_count', v_user_tx_count, 'table', TG_TABLE_NAME));
  ELSIF v_user_tx_count > 5 THEN
    INSERT INTO anomaly_events (user_id, ip_address, anomaly_type, risk_score, severity, metadata)
    VALUES (auth.uid(), v_current_ip, 'USER_VELOCITY_MED', 30, 'medium', 
      jsonb_build_object('tx_count', v_user_tx_count, 'table', TG_TABLE_NAME));
  END IF;

  -- RULE 2: IP Shared Usage (Farming Cluster)
  IF v_ip_user_count > 6 THEN
    INSERT INTO anomaly_events (user_id, ip_address, anomaly_type, risk_score, severity, metadata)
    VALUES (auth.uid(), v_current_ip, 'IP_CLUSTER_HIGH', 80, 'critical', 
      jsonb_build_object('unique_users', v_ip_user_count));
  ELSIF v_ip_user_count > 3 THEN
    INSERT INTO anomaly_events (user_id, ip_address, anomaly_type, risk_score, severity, metadata)
    VALUES (auth.uid(), v_current_ip, 'IP_CLUSTER_MED', 40, 'high', 
      jsonb_build_object('unique_users', v_ip_user_count));
  END IF;

  -- RULE 3: Hybrid Escalation
  IF v_user_tx_count > 5 AND v_ip_user_count > 3 THEN
     -- Force freeze if both occur
     UPDATE user_risk_profiles 
     SET is_frozen = true, frozen_reason = 'Hybrid Velocity/IP Cluster Detected'
     WHERE user_id = auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 5. MITIGATION LAYER (PHASE 4)
-- ------------------------------------------------------------

-- Throttling Guard Clause for RPCs
CREATE OR REPLACE FUNCTION public.check_risk_threshold(p_user_id UUID, p_max_score INTEGER DEFAULT 80)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_score INTEGER;
  v_is_frozen BOOLEAN;
BEGIN
  -- Check explicit freeze
  SELECT is_frozen INTO v_is_frozen FROM user_risk_profiles WHERE user_id = p_user_id;
  IF v_is_frozen = true THEN
    RAISE EXCEPTION 'ACCOUNT_FROZEN' USING DETAIL = 'Your account is under security review.';
  END IF;

  -- Check calculated risk
  v_score := public.calculate_user_risk_score(p_user_id);
  IF v_score >= p_max_score THEN
    RAISE EXCEPTION 'VELOCITY_LIMIT_EXCEEDED' USING DETAIL = 'Security threshold reached. Please wait.';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 6. UPDATED AUDIT TRIGGER (Captures IP/UA)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    actor_id, actor_role, action, table_name, record_id,
    old_values, new_values, ip_address
  ) VALUES (
    auth.uid(),
    COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'system'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    public.get_client_ip()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- 7. CLEANUP & GOVERNANCE
-- ------------------------------------------------------------

-- Weekly Janitor: Archive old anomalies
CREATE OR REPLACE FUNCTION public.janitor_cleanup_anomalies()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE anomaly_events 
  SET status = 'auto_mitigated' 
  WHERE status = 'open' 
    AND created_at < (NOW() - INTERVAL '7 days');
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_user_risk_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_risk_threshold(UUID, INTEGER) TO authenticated;

COMMENT ON TABLE public.anomaly_events IS 'Stores detection events for velocity and IP cluster anomalies.';
COMMENT ON FUNCTION public.get_client_ip() IS 'Extracts IP address from x-forwarded-for header.';
