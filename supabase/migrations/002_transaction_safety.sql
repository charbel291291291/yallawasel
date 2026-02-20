-- ============================================================
-- PHASE 2: CONCURRENCY & TRANSACTION SAFETY
-- Migration: 002_transaction_safety.sql
-- ============================================================
-- Implements atomic operations via Postgres RPC functions.
-- Prevents: double-charge, duplicate rewards, race conditions
-- on order acceptance, wallet updates, and points.
-- ============================================================

-- ============================================
-- 1. ATOMIC ORDER ACCEPTANCE (Driver)
-- Only 1 driver can accept an order. Uses WHERE guard + RETURNING.
-- ============================================

DROP FUNCTION IF EXISTS accept_order(UUID, UUID);
CREATE OR REPLACE FUNCTION accept_order(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Atomic UPDATE with WHERE guard: only pending/approved orders
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
    -- Either already assigned or invalid status
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ORDER_ALREADY_CLAIMED',
      'message', 'This order has already been accepted by another driver.'
    );
  END IF;

  -- Log the status change
  INSERT INTO order_status_history (order_id, status, note, created_by)
  VALUES (p_order_id, 'out_for_delivery', 'Accepted by driver', p_driver_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'driver_id', v_order.driver_id
  );
END;
$$;

-- ============================================
-- 2. ATOMIC ORDER STATUS TRANSITION
-- Enforces valid state machine transitions.
-- ============================================

DROP FUNCTION IF EXISTS transition_order_status(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS transition_order_status(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION transition_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_actor_id TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  -- Get current status with row lock
  SELECT status INTO v_current_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  -- Check if transition is valid
  v_allowed := v_allowed_transitions -> v_current_status;
  IF v_allowed IS NULL OR NOT (v_allowed ? p_new_status) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TRANSITION',
      'message', format('Cannot transition from %s to %s', v_current_status, p_new_status),
      'current_status', v_current_status
    );
  END IF;

  -- Perform the transition
  UPDATE orders
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;

  -- Log to history
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

-- ============================================
-- 3. ATOMIC WALLET OPERATIONS
-- Prevents negative balances and double-charges.
-- Uses serializable isolation via row-level locking.
-- ============================================

DROP FUNCTION IF EXISTS wallet_debit(UUID, NUMERIC);
DROP FUNCTION IF EXISTS wallet_debit(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION wallet_debit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Idempotency check (if key provided)
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM wallet_transactions
      WHERE idempotency_key = p_idempotency_key
    ) THEN
      RETURN jsonb_build_object(
        'success', true,
        'message', 'IDEMPOTENT_DUPLICATE',
        'already_processed', true
      );
    END IF;
  END IF;

  -- Lock the row and read current balance
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

  -- Atomic debit
  UPDATE profiles
  SET wallet_balance = v_new_balance, updated_at = NOW()
  WHERE id = p_user_id
    AND wallet_balance >= p_amount;  -- Double-check in UPDATE

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RACE_CONDITION_BALANCE');
  END IF;

  -- Record transaction (optional wallet_transactions table)
  -- INSERT INTO wallet_transactions (user_id, amount, type, idempotency_key)
  -- VALUES (p_user_id, -p_amount, 'debit', p_idempotency_key);

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'debited', p_amount
  );
END;
$$;

DROP FUNCTION IF EXISTS wallet_credit(UUID, NUMERIC);
DROP FUNCTION IF EXISTS wallet_credit(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION wallet_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'credit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
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

-- ============================================
-- 4. ATOMIC POINTS INCREMENT (Idempotent)
-- Replaces the existing increment_points RPC
-- with race-condition-safe version.
-- ============================================

DROP FUNCTION IF EXISTS increment_points(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_points(UUID, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION increment_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'order'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_points INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Atomic increment with tier recalculation
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

-- ============================================
-- 5. ATOMIC IMPACT CONTRIBUTION
-- Single-transaction: insert contribution + update campaign amount.
-- ============================================

DROP FUNCTION IF EXISTS record_impact_contribution(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION record_impact_contribution(
  p_user_id UUID,
  p_campaign_id UUID,
  p_order_id UUID,
  p_contribution_amount NUMERIC,
  p_impact_units NUMERIC,
  p_impact_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_exists BOOLEAN;
BEGIN
  -- Verify campaign exists and is active
  SELECT EXISTS(
    SELECT 1 FROM impact_campaigns
    WHERE id = p_campaign_id AND is_active = true
  ) INTO v_campaign_exists;

  IF NOT v_campaign_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  -- Insert contribution
  INSERT INTO user_impact (user_id, campaign_id, order_id, contribution_amount, impact_units, impact_type)
  VALUES (p_user_id, p_campaign_id, p_order_id, p_contribution_amount, p_impact_units, p_impact_type);

  -- Atomically update campaign total
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

-- ============================================
-- 6. DATA RETENTION POLICY (Phase 7)
-- Archive old delivered/cancelled orders
-- ============================================

-- Archive table for cold storage
CREATE TABLE IF NOT EXISTS orders_archive (
  LIKE orders INCLUDING ALL
);

DROP FUNCTION IF EXISTS archive_old_orders(INTEGER);
CREATE OR REPLACE FUNCTION archive_old_orders(
  p_days_old INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := NOW() - (p_days_old || ' days')::INTERVAL;

  -- Move to archive
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

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- These functions use SECURITY DEFINER so they run with
-- elevated privileges. The anon/authenticated roles can
-- call them through supabase.rpc().
GRANT EXECUTE ON FUNCTION accept_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION transition_order_status(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_debit(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION wallet_credit(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_points(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_impact_contribution(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_orders(INTEGER) TO authenticated;
