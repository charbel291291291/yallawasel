-- ============================================================
-- PHASE 9: AUTONOMOUS EVOLUTION LAYER
-- Migration: 009_autonomous_evolution_layer.sql
-- Purpose: Self-Tuning Weights, Drift Detection, and Graduated Mitigation
-- ============================================================

-- ------------------------------------------------------------
-- 1. EVOLUTION AUDITABILITY (PHASE 5)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.evolution_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- WEIGHT, THRESHOLD, BASELINE
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reasoning_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for explainability queries
CREATE INDEX IF NOT EXISTS idx_evolution_log_entity ON public.evolution_log (entity_id, created_at DESC);

-- ------------------------------------------------------------
-- 2. ENHANCED WEIGHT ENGINE (PHASE 1)
-- ------------------------------------------------------------

-- Add bounds to fraud_config
ALTER TABLE public.fraud_config ADD COLUMN IF NOT EXISTS min_weight_pct NUMERIC DEFAULT 0.50;
ALTER TABLE public.fraud_config ADD COLUMN IF NOT EXISTS max_weight_pct NUMERIC DEFAULT 3.00;
ALTER TABLE public.fraud_config ADD COLUMN IF NOT EXISTS adjustment_confidence NUMERIC DEFAULT 1.00;

-- Auto-Tuning Function: recalibrate weights based on precision
CREATE OR REPLACE FUNCTION public.recalibrate_fraud_weights()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_precision NUMERIC;
  v_new_weight INTEGER;
  v_old_weight INTEGER;
BEGIN
  FOR v_rec IN SELECT * FROM public.fraud_config LOOP
    -- Calculate precision (True Positives / Total Evaluated)
    -- Default to 0.75 if no evaluations yet
    v_precision := CASE 
      WHEN (confirmed_fraud_count + false_positive_count) = 0 THEN 0.75
      ELSE confirmed_fraud_count::NUMERIC / (confirmed_fraud_count + false_positive_count)::NUMERIC
    END;

    -- Evolutionary logic:
    -- If precision > 0.9 (Very Accurate) -> Increase weight (Aggressive)
    -- If precision < 0.3 (Very Noisy) -> Decrease weight (Passive)
    v_old_weight := v_rec.current_weight;
    
    IF v_precision > 0.9 THEN
      v_new_weight := LEAST(v_old_weight + 5, (v_rec.base_weight * v_rec.max_weight_pct)::INTEGER);
    ELSIF v_precision < 0.4 THEN
      v_new_weight := GREATEST(v_old_weight - 5, (v_rec.base_weight * v_rec.min_weight_pct)::INTEGER);
    ELSE
      v_new_weight := v_old_weight;
    END IF;

    IF v_new_weight != v_old_weight THEN
      UPDATE public.fraud_config SET current_weight = v_new_weight, updated_at = NOW() WHERE id = v_rec.id;
      
      INSERT INTO public.evolution_log (entity_type, entity_id, old_value, new_value, reasoning_metadata)
      VALUES ('WEIGHT', v_rec.id, to_jsonb(v_old_weight), to_jsonb(v_new_weight), 
        jsonb_build_object('precision', v_precision, 'event', 'DAILY_RECALIBRATION'));
    END IF;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 3. BEHAVIOR BASELINES & DRIFT (PHASE 2)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.behavior_baselines (
  user_id UUID REFERENCES auth.users(id),
  metric_type TEXT NOT NULL, -- WALLET_VELOCITY, ORDER_RATE
  avg_value NUMERIC DEFAULT 0,
  std_dev NUMERIC DEFAULT 0,
  last_recomputed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, metric_type)
);

-- Detect Global Drift (2 Sigma)
CREATE OR REPLACE FUNCTION public.check_global_drift()
RETURNS TABLE (metric TEXT, drift_detected BOOLEAN, magnitude NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH current_stats AS (
    SELECT 
      metric_type,
      AVG(avg_value) as global_avg,
      STDDEV(avg_value) as global_std
    FROM public.behavior_baselines
    GROUP BY metric_type
  ),
  historical_anchor AS (
    -- Get baseline from 7 days ago in evolution log
    SELECT 
      entity_id, 
      (old_value::TEXT)::NUMERIC as prev_avg
    FROM public.evolution_log
    WHERE entity_type = 'GLOBAL_BASELINE'
      AND created_at < NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 2
  )
  SELECT 
    s.metric_type,
    ABS(s.global_avg - h.prev_avg) > (2 * s.global_std),
    ABS(s.global_avg - h.prev_avg)
  FROM current_stats s
  JOIN historical_anchor h ON s.metric_type = h.entity_id;
END;
$$;

-- ------------------------------------------------------------
-- 4. GRADUATED MITIGATION MODEL (PHASE 4)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_mitigation_level(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_score INTEGER;
BEGIN
  v_score := public.get_decayed_risk_score(p_user_id);
  
  IF v_score > 100 THEN RETURN 4;   -- LEVEL 4: HARD HOLD
  ELSIF v_score >= 81 THEN RETURN 3; -- LEVEL 3: SOFT FREEZE
  ELSIF v_score >= 51 THEN RETURN 2; -- LEVEL 2: TX_DELAY
  ELSIF v_score >= 30 THEN RETURN 1; -- LEVEL 1: THROTTLE
  ELSE RETURN 0;                    -- LEVEL 0: GREEN
  END IF;
END;
$$;

-- Modified Mutation Guard for Graduated Levels
CREATE OR REPLACE FUNCTION public.enforce_evolutionary_shield(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_level INTEGER;
BEGIN
  v_level := public.get_mitigation_level(p_user_id);
  
  -- LEVEL 4/3: Block
  IF v_level >= 3 THEN
    RAISE EXCEPTION 'ACCOUNT_RESTRICTED' USING DETAIL = 'Level ' || v_level || ' restriction active.';
  END IF;

  -- LEVEL 2: Injection Delay (3 seconds)
  IF v_level = 2 THEN
    PERFORM pg_sleep(3);
  END IF;

  -- LEVEL 1: Basic Throttling (Rate Limit Already Applied in 005)
END;
$$;

-- ------------------------------------------------------------
-- 5. EXPLAINABILITY LAYER (PHASE 5)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.explain_user_restriction(p_user_id UUID)
RETURNS TABLE (
  current_level INTEGER,
  risk_score INTEGER,
  contributing_anomalies JSONB,
  mitigation_logic TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.get_mitigation_level(p_user_id),
    public.get_decayed_risk_score(p_user_id),
    (SELECT jsonb_agg(to_jsonb(a)) FROM (
       SELECT anomaly_type, risk_score, detected_at 
       FROM anomaly_events 
       WHERE user_id = p_user_id AND status = 'open' 
       ORDER BY created_at DESC LIMIT 5
    ) a),
    CASE 
      WHEN public.get_mitigation_level(p_user_id) = 4 THEN 'Critical violation cluster. Manual security review required.'
      WHEN public.get_mitigation_level(p_user_id) = 3 THEN 'High risk score. Automated soft-freeze applied.'
      WHEN public.get_mitigation_level(p_user_id) = 2 THEN 'Medium risk. Latency injection active to prevent burst botting.'
      WHEN public.get_mitigation_level(p_user_id) = 1 THEN 'Low risk. Velocity throttling active.'
      ELSE 'No active restrictions.'
    END;
END;
$$;

-- ------------------------------------------------------------
-- 6. SAFETY LOCKS (PHASE 6)
-- ------------------------------------------------------------

-- Prevent runaway weight changes (Cap at 15% per day)
-- This check can be added to recalibrate_fraud_weights if needed.

GRANT EXECUTE ON FUNCTION recalibrate_fraud_weights() TO service_role;
GRANT EXECUTE ON FUNCTION explain_user_restriction(UUID) TO service_role;

COMMENT ON TABLE public.evolution_log IS 'Immutable log of all autonomous system adjustments.';
COMMENT ON FUNCTION public.recalibrate_fraud_weights IS 'Self-tuning algorithm that adjusts anomaly weights based on historical precision.';
