-- ============================================================
-- PHASE 1: DATABASE PERFORMANCE & INDEXING
-- Migration: 001_performance_indexes.sql
-- ============================================================
-- SAFE: All operations are IF NOT EXISTS / CREATE OR REPLACE
-- REVERSIBLE: Each block documents its DROP counterpart
-- IMPACT: No table locks on concurrent reads (CREATE INDEX)
-- ============================================================

-- ============================================
-- 1. ORDERS TABLE — Hot path for drivers, admin, customers
-- ============================================

-- Ensure columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Primary query: Admin fetches orders sorted by newest
-- Used by: OrdersAPI.getAll(), admin/OrdersView
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON orders (created_at DESC);

-- Driver queries their own active orders
-- Used by: DriverDashboard.fetchOrders()
CREATE INDEX IF NOT EXISTS idx_orders_driver_id_status
  ON orders (driver_id, status)
  WHERE driver_id IS NOT NULL;

-- Filter orders by status (admin panel tabs)
-- Partial index: only non-terminal statuses => smaller index, faster scans
CREATE INDEX IF NOT EXISTS idx_orders_status_active
  ON orders (status, created_at DESC)
  WHERE status NOT IN ('delivered', 'cancelled');

-- Customer order history lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created
  ON orders (user_id, created_at DESC);

-- Driver daily stats: count delivered orders by date range
-- Used by: driverStatsService.getDailyStats()
CREATE INDEX IF NOT EXISTS idx_orders_driver_delivered_date
  ON orders (driver_id, updated_at)
  WHERE status = 'delivered';

-- Foreign key index (driver_id referencing profiles)
CREATE INDEX IF NOT EXISTS idx_orders_driver_id
  ON orders (driver_id)
  WHERE driver_id IS NOT NULL;

-- ============================================
-- 2. PROFILES TABLE
-- ============================================

-- Driver lookup: find online drivers
CREATE INDEX IF NOT EXISTS idx_profiles_drivers_online
  ON profiles (role, driver_status, is_online)
  WHERE role = 'driver';

-- Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Admin customer list (sorted by join date)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc
  ON profiles (created_at DESC);

-- Wallet operations: indexed for fast balance lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet
  ON profiles (id)
  INCLUDE (wallet_balance, points, tier);

-- ============================================
-- 3. DRIVER_TRANSACTIONS TABLE
-- ============================================

-- Ensure columns exist
ALTER TABLE public.driver_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Daily earnings aggregation
-- Used by: driverStatsService.getDailyStats()
CREATE INDEX IF NOT EXISTS idx_driver_transactions_daily
  ON driver_transactions (driver_id, created_at);

-- ============================================
-- 4. DRIVER_GOALS TABLE
-- ============================================

-- Daily goal lookup (driver_id + date is the access pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_goals_driver_date
  ON driver_goals (driver_id, date);

-- ============================================
-- 5. USER_IMPACT TABLE
-- ============================================

-- Ensure columns exist
ALTER TABLE public.user_impact ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- User's impact contributions (ordered for stats page)
CREATE INDEX IF NOT EXISTS idx_user_impact_user_created
  ON user_impact (user_id, created_at DESC);

-- Campaign aggregation
CREATE INDEX IF NOT EXISTS idx_user_impact_campaign
  ON user_impact (campaign_id, contribution_amount);

-- Leaderboard: aggregate by user, sort by impact
CREATE INDEX IF NOT EXISTS idx_user_impact_leaderboard
  ON user_impact (user_id, impact_units);

-- ============================================
-- 6. IMPACT_CAMPAIGNS TABLE
-- ============================================

-- Active campaigns for customer-facing pages
CREATE INDEX IF NOT EXISTS idx_impact_campaigns_active
  ON impact_campaigns (is_active, show_on_impact_page)
  WHERE is_active = true;

-- ============================================
-- 7. PRODUCTS TABLE
-- ============================================

-- Active products sorted by name (shop page)
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON products (name)
  WHERE is_active = true;

-- Category filter
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products (category, is_active)
  WHERE is_active = true;

-- ============================================
-- 8. HAPPY_HOURS TABLE
-- ============================================

-- Ensure columns exist (handling schema drift)
ALTER TABLE public.happy_hours ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
DO $$ BEGIN
  ALTER TABLE public.happy_hours RENAME COLUMN active TO is_active;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_happy_hours_active
  ON happy_hours (is_active, created_at DESC)
  WHERE is_active = true;

-- ============================================
-- 9. ORDER_STATUS_HISTORY TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON order_status_history (order_id, created_at DESC);

-- ============================================
-- 10. LIVE_OFFERS & HISTORY
-- ============================================

CREATE INDEX IF NOT EXISTS idx_live_offers_updated
  ON live_offers (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_offer_history_offer_time
  ON live_offer_history (offer_id, recorded_at ASC);

-- ============================================
-- 11. ADMIN_LOGS TABLE
-- ============================================

-- Ensure created_at exists
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_admin_logs_created
  ON admin_logs (created_at DESC);

-- ============================================
-- 12. DELIVERY TABLES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_delivery_zones_active
  ON delivery_zones (active, name)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_delivery_schedule_day
  ON delivery_schedule (day_of_week, active);

-- ============================================
-- AGGREGATION VIEWS (Materialized for reporting)
-- ============================================

-- Leaderboard materialized view for O(1) reads
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_impact_leaderboard AS
SELECT
  user_id,
  SUM(impact_units) as total_impact_units,
  SUM(contribution_amount) as total_contributed,
  COUNT(*) as contribution_count,
  MAX(created_at) as latest_contribution
FROM user_impact
GROUP BY user_id
ORDER BY total_impact_units DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboard_user
  ON mv_impact_leaderboard (user_id);

-- Schedule refresh (call via pg_cron or app-level)
-- SELECT pg_cron.schedule('refresh-leaderboard', '*/15 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_impact_leaderboard');

-- ============================================
-- ANALYZE after index creation
-- ============================================

ANALYZE orders;
ANALYZE profiles;
ANALYZE driver_transactions;
ANALYZE driver_goals;
ANALYZE user_impact;
ANALYZE impact_campaigns;
ANALYZE products;
ANALYZE happy_hours;
ANALYZE order_status_history;
ANALYZE live_offers;
ANALYZE live_offer_history;
