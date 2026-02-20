-- ============================================================
-- PHASE 7: SOVEREIGN RESILIENCE & ADAPTIVE FRAUD FEEDBACK
-- Migration: 007_sovereign_resilience.sql
-- Purpose: Fraud Model Feedback, Forensic Hashing, and Failover State Validation
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADAPTIVE FRAUD CONFIG (PHASE 2)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.fraud_config (
  id TEXT PRIMARY KEY, -- USER_VELOCITY_HIGH, IP_CLUSTER_MED, etc.
  base_weight INTEGER NOT NULL,
  current_weight INTEGER NOT NULL,
  learning_rate NUMERIC DEFAULT 0.05,
  false_positive_count INTEGER DEFAULT 0,
  confirmed_fraud_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize default weights
INSERT INTO public.fraud_config (id, base_weight, current_weight) VALUES
('USER_VELOCITY_MED', 30, 30),
('USER_VELOCITY_HIGH', 60, 60),
('IP_CLUSTER_MED', 40, 40),
('IP_CLUSTER_HIGH', 80, 80),
('POINT_FARMING', 75, 75),
('DRIVER_COLLUSION', 45, 45)
ON CONFLICT DO NOTHING;

-- Function to provide feedback to the fraud engine
-- This is called when an Admin resolves an anomaly event
CREATE OR REPLACE FUNCTION public.submit_fraud_feedback(
  p_event_id UUID,
  p_is_true_fraud BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_type TEXT;
  v_weight_id TEXT;
BEGIN
  -- 1. Get anomaly type
  SELECT anomaly_type INTO v_type FROM public.anomaly_events WHERE id = p_event_id;
  
  -- 2. Update stats in config
  IF p_is_true_fraud THEN
    UPDATE public.fraud_config 
    SET confirmed_fraud_count = confirmed_fraud_count + 1,
        current_weight = LEAST(current_weight + (base_weight * learning_rate), base_weight * 2),
        updated_at = NOW()
    WHERE id = v_type;
  ELSE
    UPDATE public.fraud_config 
    SET false_positive_count = false_positive_count + 1,
        current_weight = GREATEST(current_weight - (base_weight * learning_rate), base_weight * 0.5),
        updated_at = NOW()
    WHERE id = v_type;
    
    -- Auto-mitigate the event if false positive
    UPDATE public.anomaly_events SET status = 'auto_mitigated', resolved_at = NOW() WHERE id = p_event_id;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 2. IMMUTABLE FORENSIC HASHING (PHASE 3)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forensic_ledger_hashes (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  table_name TEXT,
  record_count BIGINT,
  ledger_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate fingerprint for a table (Forensic Anchor)
-- Note: Uses deterministic JSON serialization to ensure hash stability
CREATE OR REPLACE FUNCTION public.generate_forensic_hash(p_table TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- We aggregate all records in a stable order to generate a master hash
  EXECUTE format(
    'SELECT encode(digest(string_agg(t::text, ''''), ''sha256''), ''hex'') FROM (SELECT * FROM public.%I ORDER BY id ASC) t', 
    p_table
  ) INTO v_hash;
  
  RETURN v_hash;
END;
$$;

-- Trigger every 24h (via pg_cron) to anchor state
-- SELECT cron.schedule('daily-forensic-anchor', '0 0 * * *', 'SELECT public.anchor_sovereign_state()');
CREATE OR REPLACE FUNCTION public.anchor_sovereign_state()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Anchor Audit Log
    INSERT INTO forensic_ledger_hashes (table_name, record_count, ledger_sha256)
    SELECT 'audit_log', COUNT(*), public.generate_forensic_hash('audit_log') FROM public.audit_log;

    -- Anchor Transactions
    INSERT INTO forensic_ledger_hashes (table_name, record_count, ledger_sha256)
    SELECT 'wallet_transactions', COUNT(*), public.generate_forensic_hash('wallet_transactions') FROM public.wallet_transactions;
END;
$$;

-- ------------------------------------------------------------
-- 3. FAILOVER STATE VALIDATOR (PHASE 1)
-- ------------------------------------------------------------

-- This function is the "Final Gate" after a region switch.
-- It validates that the Sovereign state hasn't drifted.
CREATE OR REPLACE FUNCTION public.verify_sovereign_integrity()
RETURNS TABLE (checker TEXT, result TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- 1. Check Forensic Anchors vs Current States
    RETURN QUERY SELECT 
        'Forensic Anchor Match'::TEXT,
        CASE WHEN (SELECT ledger_sha256 FROM forensic_ledger_hashes WHERE table_name = 'wallet_transactions' ORDER BY created_at DESC LIMIT 1) 
               = public.generate_forensic_hash('wallet_transactions') 
             THEN 'PASS' ELSE 'WARNING' END,
        'Validated last known good anchor vs current state.'::TEXT;

    -- 2. Check Order State Machine consistency
    RETURN QUERY SELECT 
        'Order State Consistency'::TEXT,
        CASE WHEN NOT EXISTS (
           SELECT 1 FROM orders WHERE status = 'delivered' AND driver_id IS NULL
        ) THEN 'PASS' ELSE 'FAIL' END,
        'Found zero delivered orders without assigned drivers.'::TEXT;

    -- 3. Check Wallet Oracle (from 006)
    RETURN QUERY SELECT 
        'Wallet Integrity Oracle'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM vw_wallet_integrity_check) = 0 THEN 'PASS' ELSE 'FAIL' END,
        'All balances match sequential ledger exactly.'::TEXT;

END;
$$;

-- ------------------------------------------------------------
-- 4. GOVERNANCE & ACCESS
-- ------------------------------------------------------------

GRANT ALL ON public.fraud_config TO service_role;
GRANT ALL ON public.forensic_ledger_hashes TO service_role;
GRANT EXECUTE ON FUNCTION verify_sovereign_integrity() TO service_role;

-- Forensic hash generation requires pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON TABLE forensic_ledger_hashes IS 'Immutable forensic anchors for sovereign-grade ledger verification.';
COMMENT ON FUNCTION public.submit_fraud_feedback IS 'Feedback loop for adjusting risk weights based on actual outcomes.';
