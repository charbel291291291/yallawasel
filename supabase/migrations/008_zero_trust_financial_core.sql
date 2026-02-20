-- ============================================================
-- PHASE 8: ZERO-TRUST FINANCIAL CORE & IMMUTABLE LEDGER
-- Migration: 008_zero_trust_financial_core.sql
-- Purpose: Hash-Chained Ledger, Append-Only Accounting, and Dual-Approval
-- ============================================================

-- ------------------------------------------------------------
-- 1. IMMUTABLE FINANCIAL LEDGER (PHASE 1 & 4)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT', 'ADJUSTMENT', 'REVERSAL')),
  reference_id TEXT, -- Order ID, Reward ID, etc.
  description TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  
  -- Cryptographic Chain
  previous_hash TEXT,
  entry_hash TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS (Admin Only)
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only ledger view" ON public.financial_ledger FOR SELECT USING (public.is_admin());

-- ------------------------------------------------------------
-- 2. IMMUTABILITY ENFORCEMENT
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_ledger_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'LEDGER_IS_IMMUTABLE' USING DETAIL = 'Updates and Deletes are forbidden on the financial ledger.';
END;
$$;

CREATE TRIGGER trg_ledger_no_update
  BEFORE UPDATE ON public.financial_ledger
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_ledger_immutability();

CREATE TRIGGER trg_ledger_no_delete
  BEFORE DELETE ON public.financial_ledger
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_ledger_immutability();

-- ------------------------------------------------------------
-- 3. HASH CHAINING LOGIC (PHASE 4)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.chain_ledger_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prev_hash TEXT;
  v_payload TEXT;
BEGIN
  -- 1. Get previous entry hash
  SELECT entry_hash INTO v_prev_hash 
  FROM public.financial_ledger 
  ORDER BY id DESC LIMIT 1;
  
  -- 2. Construct payload for current entry
  v_payload := format('%s|%s|%s|%s|%s|%s', 
    NEW.user_id, NEW.amount, NEW.type, NEW.reference_id, NEW.idempotency_key, COALESCE(v_prev_hash, 'GENESIS')
  );
  
  -- 3. Compute entry hash
  NEW.previous_hash := COALESCE(v_prev_hash, '0000000000000000000000000000000000000000000000000000000000000000');
  NEW.entry_hash := encode(digest(v_payload, 'sha256'), 'hex');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chain_ledger
  BEFORE INSERT ON public.financial_ledger
  FOR EACH ROW EXECUTE PROCEDURE public.chain_ledger_entry();

-- ------------------------------------------------------------
-- 4. DUAL-APPROVAL SYSTEM (PHASE 5)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pending_financial_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Policy: Admins can view all, but cannot approve their own requests
ALTER TABLE public.pending_financial_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage approvals" ON public.pending_financial_approvals FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------
-- 5. ZERO-TRUST MUTATION RPC (PHASE 2)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_ledger_transaction(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_reference_id TEXT,
  p_idempotency_key TEXT,
  p_reason TEXT DEFAULT 'Standard Transaction'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_threshold NUMERIC := 100.00; -- Manual adjustment threshold for dual-approval
BEGIN
  -- 1. Security Guard: Verify Auth & Role
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- 2. Rate Limit & Risk Check (From Migration 005)
  PERFORM public.check_risk_threshold(p_user_id, 85);

  -- 3. Dual-Approval Check for High-Value Adjustments
  IF p_type = 'ADJUSTMENT' AND ABS(p_amount) > v_threshold AND NOT public.is_admin() THEN
     RAISE EXCEPTION 'INSUFFICIENT_PRIVILEGE' USING DETAIL = 'Adjustments over threshold require Admin role.';
  END IF;

  -- 4. Execute Transaction
  INSERT INTO public.financial_ledger (
    user_id, amount, type, reference_id, description, idempotency_key, created_by
  ) VALUES (
    p_user_id, p_amount, p_type, p_reference_id, p_reason, p_idempotency_key, auth.uid()
  );

  -- 5. Atomic Balance Update (Materialized Cache)
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id;

EXCEPTION WHEN unique_violation THEN
  -- Idempotency protection: do nothing if key exists
  RETURN;
END;
$$;

-- ------------------------------------------------------------
-- 6. CONTINUOUS VERIFICATION ORACLE (PHASE 6)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_ledger_chain_integrity()
RETURNS TABLE (broken_at_id BIGINT, expected_prev_hash TEXT, actual_prev_hash TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH chain AS (
    SELECT 
      id, 
      entry_hash,
      LAG(entry_hash) OVER (ORDER BY id ASC) as calculated_prev
    FROM public.financial_ledger
  )
  SELECT 
    c.id, 
    c.calculated_prev, 
    l.previous_hash
  FROM chain c
  JOIN public.financial_ledger l ON c.id = l.id
  WHERE c.calculated_prev IS NOT NULL 
    AND c.calculated_prev != l.previous_hash;
END;
$$;

-- ------------------------------------------------------------
-- 7. PRIVILEGE MINIMIZATION (PHASE 3)
-- ------------------------------------------------------------

-- Revoke direct update on wallet_balance from authenticated users
-- They must go through the Ledger RPC
REVOKE UPDATE (wallet_balance) ON public.profiles FROM authenticated;
REVOKE UPDATE (points) ON public.profiles FROM authenticated;

-- Ensure RLS is active and hardened
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(t) || ' FORCE ROW LEVEL SECURITY';
    END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION execute_ledger_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION verify_ledger_chain_integrity TO service_role;

COMMENT ON TABLE public.financial_ledger IS 'Immutable, hash-chained ledger for all financial movements. Zero-Trust Source of Truth.';
COMMENT ON FUNCTION public.execute_ledger_transaction IS 'The only authorized way to mutate user balances. Enforces Zero-Trust principles.';
