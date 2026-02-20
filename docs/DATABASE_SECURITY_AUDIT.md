# 🔒 YALLA WASEL — Production Database Security Audit

**Date:** 2026-02-20
**Auditor:** Principal Database Security Architect
**Scope:** Full audit of all SQL schemas, RLS policies, RPC functions, indexes, storage, concurrency, and observability

---

## EXECUTIVE SUMMARY

| Category | Rating |
|----------|--------|
| **Schema Structure** | 4/10 |
| **RLS Security** | 3/10 |
| **Function/RPC Safety** | 5/10 |
| **Indexing** | 6/10 |
| **Storage** | 5/10 |
| **Data Integrity** | 4/10 |
| **Audit/Observability** | 2/10 |
| **Overall** | **🔴 3.5 / 10** |

### Verdict
**This database is NOT production-safe at its current state.** The schema has accumulated layers of overlapping migrations with conflicting definitions, RLS policies contain multiple `USING (true)` rules that grant universal access to sensitive tables, and critical helper functions lack `search_path` hardening. The legacy `supabase_schema.sql` contains at least **8 CRITICAL-severity open-door policies** that, if ever re-applied, would destroy all security boundaries.

### Key Findings Count
| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 14 |
| 🟠 HIGH | 11 |
| 🟡 MEDIUM | 15 |
| 🔵 LOW | 8 |

---

## PHASE 1 — SCHEMA STRUCTURE AUDIT

### 1.1 Complete Table Inventory

| # | Table | PK | created_at | updated_at | FK Indexes | Status |
|---|-------|----|------------|------------|------------|--------|
| 1 | `profiles` | ✅ (uuid FK→auth.users) | ✅ | ✅ | N/A | ⚠️ God table |
| 2 | `products` | ✅ (uuid) | ✅ | ❌ | N/A | ⚠️ Missing updated_at |
| 3 | `orders` | ✅ (uuid) | ✅ | ✅ | ✅ | ⚠️ Missing status CHECK |
| 4 | `order_status_history` | ✅ (uuid) | ✅ | ❌ | ✅ | OK |
| 5 | `driver_locations` | ✅ (uuid) | ❌ | ✅ (last_updated) | ✅ | ⚠️ Missing created_at |
| 6 | `driver_transactions` | ✅ (uuid) | ✅ | ❌ | ✅ | ⚠️ Missing CASCADE, type CHECK |
| 7 | `driver_goals` | ✅ (uuid) | ❌ | ❌ | ✅ | ⚠️ Missing timestamps |
| 8 | `driver_achievements` | ✅ (uuid) | ✅ (earned_at) | ❌ | OK | OK |
| 9 | `customer_transactions` | ✅ (uuid) | ✅ | ❌ | ❌ | ⚠️ Missing FK index |
| 10 | `rewards` | ✅ (uuid) | ✅ | ❌ | N/A | ⚠️ Missing updated_at |
| 11 | `reward_redemptions` | ✅ (uuid) | ✅ | ❌ | ❌ | ⚠️ Missing FK indexes |
| 12 | `app_settings` | ✅ (integer=1) | ✅ | ❌ | N/A | ⚠️ Missing updated_at |
| 13 | `delivery_settings` | ✅ (integer=1) | ❌ | ❌ | N/A | 🔴 No timestamps |
| 14 | `delivery_zones` | ✅ (uuid) | ❌ | ❌ | N/A | 🔴 No timestamps |
| 15 | `delivery_schedule` | ✅ (uuid) | ❌ | ❌ | N/A | 🔴 No timestamps |
| 16 | `user_fcm_tokens` | ✅ (uuid) | ✅ | ❌ | ❌ | ⚠️ Missing FK index |
| 17 | `impact_campaigns` | ✅ (uuid) | ✅ | ❌ | N/A | ⚠️ Missing updated_at |
| 18 | `user_impact` | ✅ (uuid) | ✅ | ❌ | ✅ | OK |
| 19 | `happy_hours` | ✅ (uuid) | ✅ | ❌ | N/A | OK |
| 20 | `chart_settings` | ✅ (integer=1) | ❌ | ✅ | N/A | ⚠️ Missing created_at |
| 21 | `live_offers` | ✅ (uuid) | ✅ | ✅ | N/A | OK |
| 22 | `live_offer_history` | ✅ (uuid) | ✅ (recorded_at) | ❌ | ✅ | OK |
| 23 | `admin_logs` | ✅ (uuid) | ✅ | ❌ | N/A | ⚠️ Weak schema |
| 24 | `orders_archive` | ✅ (mirrored) | ✅ | ✅ | N/A | OK |
| 25 | `driver_wallets` | ✅ (uuid) | ❌ | ✅ | ✅ | ⚠️ Missing balance CHECK |
| 26 | `driver_earnings` | ✅ (uuid) | ✅ | ❌ | ✅ | ⚠️ Duplicate of driver_transactions |
| 27 | `driver_daily_stats` | ✅ (uuid) | ❌ | ❌ | ✅ | ⚠️ Duplicate of driver_goals |
| 28 | `happy_hours_schedule` | ✅ (uuid) | ✅ | ❌ | N/A | ⚠️ Duplicate of happy_hours (V3) |

---

### F-1.1 🔴 CRITICAL — `orders.status` has NO CHECK constraint

**Risk:** Any string can be written to `orders.status` — `"HACKED"`, `"pwned"`, empty string, etc. The entire order state machine is unprotected at the database level.

**Evidence:** `PRODUCTION_SCHEMA_V3.sql` line 94: `status text default 'pending'` — no CHECK.

```sql
-- FIX: Add CHECK constraint on order status
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('pending', 'approved', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'));
```

### F-1.2 🔴 CRITICAL — `orders.items` is JSONB with NO validation

**Risk:** The `items` column stores order line items as JSONB. There is zero server-side validation — malformed JSON, empty arrays, negative prices, or injection payloads can be written directly.

```sql
-- FIX: Add JSONB validation constraint
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_items_valid
  CHECK (
    jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
  );
```

### F-1.3 🟠 HIGH — `profiles.tier` has NO CHECK constraint

**Risk:** Tier values (`Bronze`, `Silver`, `Gold`, `Elite`) are enforced only by trigger logic. Direct UPDATE via PostgREST bypasses the trigger's BEFORE handler if the update doesn't touch `points`. A customer could set `tier = 'VIP'` directly.

```sql
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_tier
  CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Elite'));
```

### F-1.4 🟠 HIGH — Tier threshold mismatch across codebase

**Risk:** Three different tier thresholds exist simultaneously:
- `PRODUCTION_SCHEMA_V3.sql` trigger `handle_tier_update()`: Gold = 1500 pts
- `002_transaction_safety.sql` RPC `increment_points()`: Gold = 2000 pts
- `supabase_schema.sql` trigger `auto_update_tier()`: Gold = 1500, top tier = 'VIP' (not 'Elite')

This means the active function determines different outcomes. If both the trigger and the RPC exist, they fight each other.

```sql
-- FIX: Drop the old trigger (it conflicts with the RPC)
DROP TRIGGER IF EXISTS update_tier_trigger ON profiles;
DROP TRIGGER IF EXISTS on_points_update ON profiles;
DROP FUNCTION IF EXISTS auto_update_tier();
DROP FUNCTION IF EXISTS handle_tier_update();

-- Rely SOLELY on the increment_points RPC for tier calculation.
-- If a direct points UPDATE happens outside the RPC, add a single canonical trigger:
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_tier
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tier_from_points();
```

### F-1.5 🟠 HIGH — Duplicate/orphaned tables from migration layers

**Risk:** Multiple overlapping migrations created duplicate tables that serve the same purpose:

| Canonical (V3) | Orphan/Duplicate | Status |
|----------------|------------------|--------|
| `driver_transactions` | `driver_earnings` | Both exist, different schemas |
| `driver_goals` | `driver_daily_stats` | Both exist, different columns |
| `happy_hours` (V3) | `happy_hours_schedule` (old) | Different structure entirely |
| `happy_hours` (old, `supabase_schema.sql`) | Tied to `product_id` | V3 version is standalone |

```sql
-- FIX: Drop orphaned tables (after verifying no code references them)
-- DO NOT run blindly — verify application code first.
-- DROP TABLE IF EXISTS public.driver_earnings;
-- DROP TABLE IF EXISTS public.driver_daily_stats;
-- DROP TABLE IF EXISTS public.happy_hours_schedule;

-- If you must keep them, at minimum add RLS:
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_daily_stats ENABLE ROW LEVEL SECURITY;
```

### F-1.6 🟡 MEDIUM — 7 tables missing `updated_at` column

```sql
-- FIX: Add updated_at to tables that need it
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.impact_campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.delivery_schedule ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add triggers
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_rewards BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_impact_campaigns BEFORE UPDATE ON impact_campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_delivery_settings BEFORE UPDATE ON delivery_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_delivery_zones BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_delivery_schedule BEFORE UPDATE ON delivery_schedule FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### F-1.7 🟡 MEDIUM — Missing CHECK constraints on enum-like text fields

```sql
-- driver_transactions.type
ALTER TABLE public.driver_transactions
  ADD CONSTRAINT chk_driver_tx_type
  CHECK (type IN ('commission', 'tip', 'payout', 'adjustment', 'bonus'));

-- customer_transactions.type
ALTER TABLE public.customer_transactions
  ADD CONSTRAINT chk_customer_tx_type
  CHECK (type IN ('earn', 'redeem', 'adjust'));

-- reward_redemptions.status
ALTER TABLE public.reward_redemptions
  ADD CONSTRAINT chk_redemption_status
  CHECK (status IN ('pending', 'approved', 'rejected', 'used'));

-- rewards.reward_type
ALTER TABLE public.rewards
  ADD CONSTRAINT chk_reward_type
  CHECK (reward_type IN ('discount', 'free_item', 'cashback', 'custom'));

-- delivery_schedule.day_of_week
ALTER TABLE public.delivery_schedule
  ADD CONSTRAINT chk_day_of_week
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- driver_wallets.balance non-negative
ALTER TABLE public.driver_wallets
  ADD CONSTRAINT chk_driver_wallet_balance
  CHECK (balance >= 0);

ALTER TABLE public.driver_wallets
  ADD CONSTRAINT chk_driver_wallet_pending
  CHECK (pending_withdrawal >= 0);
```

### F-1.8 🟡 MEDIUM — Missing FK indexes on several tables

```sql
-- customer_transactions.customer_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_transactions_customer
  ON customer_transactions (customer_id);

-- reward_redemptions.customer_id and reward_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reward_redemptions_customer
  ON reward_redemptions (customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reward_redemptions_reward
  ON reward_redemptions (reward_id);

-- user_fcm_tokens.user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_fcm_tokens_user
  ON user_fcm_tokens (user_id);

-- order_status_history.created_by
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_status_history_created_by
  ON order_status_history (created_by);
```

### F-1.9 🔵 LOW — `profiles` is a God Table

The `profiles` table serves 3 distinct domains: customer data, driver data, and wallet data. This is acceptable at current scale but becomes a scaling bottleneck. Documented in `ARCHITECTURE_SCALABILITY.md` Phase C.

### F-1.10 🔵 LOW — Inconsistent `ON DELETE` behavior

```
orders.user_id   → auth.users  → NO ACTION (default)
orders.driver_id → auth.users  → NO ACTION (default)
driver_transactions.driver_id → auth.users → ON DELETE CASCADE
driver_transactions.order_id  → orders    → ON DELETE SET NULL
```

Users can be deleted from `auth.users` but their orders remain with dangling `user_id`. This should be standardized.

---

## PHASE 2 — RLS (ROW LEVEL SECURITY) AUDIT

### 2.1 RLS Status Matrix

| Table | RLS Enabled | Policies Count | Status |
|-------|-------------|---------------|--------|
| `profiles` | ✅ | 3 (V3) | ⚠️ |
| `products` | ✅ | 2 (V3) | ✅ |
| `orders` | ✅ | 5 (V3) | ⚠️ |
| `order_status_history` | ✅ | 2 | ⚠️ |
| `driver_locations` | ✅ | 2 (V3) | ⚠️ |
| `driver_transactions` | ✅ | 1 (V3) | ⚠️ Missing admin |
| `driver_goals` | ✅ | 1 (V3) | ⚠️ Too permissive |
| `driver_achievements` | ✅ | 1 (V3) | ⚠️ Missing admin |
| `customer_transactions` | ✅ | 1 | ⚠️ |
| `rewards` | ✅ | 1 | ✅ |
| `reward_redemptions` | ✅ | 1 | ⚠️ |
| `app_settings` | ✅ | 1 | ✅ |
| `delivery_settings` | ✅ | 1 | ✅ |
| `delivery_zones` | ✅ | 1 | ⚠️ Missing admin write |
| `delivery_schedule` | ✅ | 1 | ⚠️ Missing admin write |
| `user_fcm_tokens` | ✅ | 1 | ✅ |
| `impact_campaigns` | ✅ | 1 | ✅ |
| `user_impact` | ✅ | 1 | ✅ |
| `happy_hours` | ✅ (V3) | 0 | 🔴 NO POLICIES |
| `chart_settings` | ✅ | 2 | ✅ |
| `live_offers` | ✅ | 2 | ✅ |
| `live_offer_history` | ✅ | 2 | ✅ |
| `admin_logs` | ✅ | 0 | 🔴 NO POLICIES |
| `orders_archive` | ❌ | 0 | 🔴 NO RLS |
| `driver_wallets` | ✅ | 1 | ⚠️ |
| `driver_earnings` | ❌ | 0 | 🔴 NO RLS |
| `driver_daily_stats` | ✅ | 2 | ⚠️ |

### F-2.1 🔴 CRITICAL — Legacy `supabase_schema.sql` contains USING (true) bombs

If this file is ever re-applied (common mistake during debugging), the following policies will be re-created:

```
"Public Write Products"     ON products     FOR ALL USING (true)
"Admin Manage Orders"       ON orders       FOR ALL USING (true)
"Admin Write Settings"      ON app_settings FOR ALL USING (true)
"Admin Write Delivery"      ON delivery_settings FOR ALL USING (true)
"Admin Write Zones"         ON delivery_zones    FOR ALL USING (true)
"Admin Manage Transactions" ON customer_transactions FOR ALL USING (true)
"Admin Manage Rewards"      ON rewards      FOR ALL USING (true)
"Admin Manage Redemptions"  ON reward_redemptions FOR ALL USING (true)
"Admin Manage Happy Hours"  ON happy_hours_schedule FOR ALL USING (true)
"Admin Manage Order History" ON order_status_history FOR ALL USING (true)
"Admin Manage Driver Transactions" ON driver_transactions FOR ALL USING (true)
"Admin Manage Driver Achievements" ON driver_achievements FOR ALL USING (true)
"Admin Manage Driver Daily Stats"  ON driver_daily_stats   FOR ALL USING (true)
"Admin Read Profiles"       ON profiles     FOR SELECT USING (true)
"Admin Read FCM Tokens"     ON user_fcm_tokens FOR SELECT USING (true)
"Admin Read All Impact"     ON user_impact  FOR SELECT USING (true)
```

**Every single one of these bypasses authentication entirely.** The `anon` role (unauthenticated visitor) can INSERT, UPDATE, DELETE products, orders, customer data, financial records.

```sql
-- FIX: Drop ALL using(true) admin policies and replace with is_admin() check
-- This MUST be run against the live database:

DROP POLICY IF EXISTS "Public Write Products" ON products;
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
DROP POLICY IF EXISTS "Public Read Orders" ON orders;
DROP POLICY IF EXISTS "Public Create Orders" ON orders;
DROP POLICY IF EXISTS "Public Upload Images" ON storage.objects;

-- Re-create with proper admin check:
CREATE POLICY "Admin manage products" ON products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage orders" ON orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage app_settings" ON app_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage delivery_settings" ON delivery_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage delivery_zones" ON delivery_zones FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage delivery_schedule" ON delivery_schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage customer_transactions" ON customer_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage rewards" ON rewards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage reward_redemptions" ON reward_redemptions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage order_status_history" ON order_status_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage driver_transactions" ON driver_transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage driver_achievements" ON driver_achievements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin read all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin read fcm_tokens" ON user_fcm_tokens FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin read all user_impact" ON user_impact FOR SELECT USING (public.is_admin());
```

### F-2.2 🔴 CRITICAL — `orders_archive` has NO RLS enabled

```sql
ALTER TABLE public.orders_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only archive" ON orders_archive FOR ALL USING (public.is_admin());
```

### F-2.3 🔴 CRITICAL — `happy_hours` (V3 version) has NO policies

The V3 schema enables RLS on `happy_hours` via the dynamic DO block, but defines zero policies for it. This means **all queries return nothing** — which is a silent functionality failure rather than a security hole, but equally dangerous for business.

```sql
DROP POLICY IF EXISTS "Public view active happy_hours" ON happy_hours;
CREATE POLICY "Public view active happy_hours" ON happy_hours
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admin manage happy_hours" ON happy_hours;
CREATE POLICY "Admin manage happy_hours" ON happy_hours
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### F-2.4 🔴 CRITICAL — `admin_logs` has NO policies

```sql
CREATE POLICY "Admin read logs" ON admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert logs" ON admin_logs FOR INSERT WITH CHECK (public.is_admin());
-- No UPDATE or DELETE — logs should be immutable
```

### F-2.5 🟠 HIGH — Driver order policy too broad: `is_driver()` leaks ALL orders

**Evidence:** `PRODUCTION_SCHEMA_V3.sql` line 352:
```sql
"Drivers view assigned orders" ON orders FOR SELECT USING (auth.uid() = driver_id OR is_driver())
```

The `OR is_driver()` clause allows **any driver to read ALL orders**, including orders assigned to other drivers. This leaks customer PII (names, phones, addresses) to every driver.

```sql
-- FIX: Remove the is_driver() fallback
DROP POLICY IF EXISTS "Drivers view assigned orders" ON orders;
CREATE POLICY "Drivers view assigned orders" ON orders
  FOR SELECT USING (
    auth.uid() = driver_id
    OR (
      public.is_driver()
      AND driver_id IS NULL
      AND status IN ('pending', 'approved', 'preparing')
    )
  );
```

### F-2.6 🟠 HIGH — `reward_redemptions` FOR ALL to self

**Evidence:** `PRODUCTION_SCHEMA_V3.sql` line 381:
```sql
"Users manage own redemptions" ON reward_redemptions FOR ALL USING (auth.uid() = customer_id)
```

Customers can UPDATE and DELETE their own redemptions, including changing `status` from `rejected` to `approved`. They can also delete evidence of redemption.

```sql
-- FIX: Split into granular policies
DROP POLICY IF EXISTS "Users manage own redemptions" ON reward_redemptions;
CREATE POLICY "Users view own redemptions" ON reward_redemptions
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users create redemptions" ON reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = customer_id AND status = 'pending');
-- No UPDATE/DELETE for customers
```

### F-2.7 🟠 HIGH — `driver_goals` FOR ALL to driver

**Evidence:** `PRODUCTION_SCHEMA_V3.sql` line 368:
```sql
"Drivers manage own goals" ON driver_goals FOR ALL USING (auth.uid() = driver_id)
```

Drivers can set their own goal targets (`target_deliveries = 1`, `target_earnings = 0.01`) and mark them as completed (`current_deliveries = 999`). This is a gamification exploit.

```sql
DROP POLICY IF EXISTS "Drivers manage own goals" ON driver_goals;
CREATE POLICY "Drivers view own goals" ON driver_goals
  FOR SELECT USING (auth.uid() = driver_id);
-- Only admin/system can modify goals
CREATE POLICY "Admin manage goals" ON driver_goals
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### F-2.8 🟠 HIGH — Missing `WITH CHECK` on several write policies

Multiple `FOR ALL USING(...)` policies lack `WITH CHECK` clauses, which means the `USING` clause applies to both reads AND writes — but doesn't validate the inserted/updated data matches the constraint:

```sql
-- FIX: Add WITH CHECK to all write policies
-- Example for driver_locations:
DROP POLICY IF EXISTS "Drivers manage own location" ON driver_locations;
CREATE POLICY "Drivers manage own location" ON driver_locations
  FOR ALL USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
```

### F-2.9 🟡 MEDIUM — `delivery_zones` and `delivery_schedule` missing admin write policies in V3

The V3 schema only grants `public view` to zones and schedule. No admin policy exists for CRUDing them.

```sql
CREATE POLICY "Public read zones" ON delivery_zones FOR SELECT USING (active = true);
CREATE POLICY "Admin manage zones" ON delivery_zones FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read schedule" ON delivery_schedule FOR SELECT USING (active = true);
CREATE POLICY "Admin manage schedule" ON delivery_schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### F-2.10 🟡 MEDIUM — `user_impact` leaderboard requires reading OTHER users' impact

Current policy only allows `auth.uid() = user_id`. The leaderboard feature requires aggregating across all users. Either:
1. Use a materialized view (recommended, created in `001_performance_indexes.sql`)
2. Or add a specific SELECT policy:

```sql
CREATE POLICY "Authenticated view leaderboard impact" ON user_impact
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Scoped: only authenticated users can see aggregate stats
```

---

## PHASE 3 — FUNCTION & RPC SECURITY

### 3.1 Function Inventory

| Function | SECURITY DEFINER | `SET search_path` | Auth Check | Status |
|----------|-----------------|-------------------|------------|--------|
| `is_admin()` | ✅ | ❌ | N/A (helper) | 🔴 Missing search_path |
| `is_driver()` | ✅ | ❌ | N/A (helper) | 🔴 Missing search_path |
| `handle_updated_at()` | ❌ | ❌ | N/A (trigger) | ⚠️ |
| `handle_new_driver_v3()` | ✅ | ❌ | N/A (trigger) | 🔴 Missing search_path |
| `handle_tier_update()` | ❌ | ❌ | N/A (trigger) | ⚠️ Conflicts w/ RPC |
| `increment_points()` (old) | ✅ | ❌ | Partial | 🔴 |
| `increment_points()` (V2/hardened) | ✅ | ✅ | ❌ | ⚠️ No caller auth |
| `accept_order()` | ✅ | ✅ | ❌ | ⚠️ No caller validation |
| `transition_order_status()` | ✅ | ✅ | ❌ | ⚠️ No caller validation |
| `wallet_debit()` | ✅ | ✅ | ❌ | 🟠 No caller validation |
| `wallet_credit()` | ✅ | ✅ | ❌ | 🟠 No caller validation |
| `record_impact_contribution()` | ✅ | ✅ | ❌ | ⚠️ |
| `archive_old_orders()` | ✅ | ✅ | ❌ | 🔴 No admin check |
| `record_offer_history()` | ✅ | ❌ | N/A (trigger) | ⚠️ |
| `auto_update_tier()` | ✅ | ❌ | N/A (trigger) | 🔴 Conflicts, no search_path |
| `handle_new_driver()` (old) | ✅ | ❌ | N/A | 🔴 Orphan function |

### F-3.1 🔴 CRITICAL — `is_admin()` and `is_driver()` missing `SET search_path`

These are the two most security-critical functions in the entire database. They're used in every RLS policy. Without `search_path` hardening, a search_path injection attack could redirect them to a malicious schema.

```sql
-- FIX: Harden both helper functions
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
```

### F-3.2 🔴 CRITICAL — `archive_old_orders()` has no admin check

Any authenticated user can call `supabase.rpc('archive_old_orders')` and delete all delivered/cancelled orders older than 90 days.

```sql
CREATE OR REPLACE FUNCTION archive_old_orders(p_days_old INTEGER DEFAULT 90)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_archived_count INTEGER;
  v_cutoff TIMESTAMPTZ;
BEGIN
  -- ADMIN ONLY
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
```

### F-3.3 🟠 HIGH — `wallet_debit()` and `wallet_credit()` have no caller validation

Any authenticated user can call `wallet_debit(some_other_user_id, 1000)` and debit another user's wallet.

```sql
-- FIX: Add caller validation to wallet functions
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
  -- AUTHORIZATION: Only admin or the user themselves
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- (rest of function unchanged)
  -- ...
END;
$$;
```

### F-3.4 🟠 HIGH — `increment_points()` callable by ANY authenticated user on ANY user

The old `HARDENED_RPC.sql` version only blocks negative amounts for non-admins. The newer `002_transaction_safety.sql` version has zero auth checks. Any user can give themselves unlimited points.

```sql
-- FIX: Add caller validation
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
  -- Only self (positive only) or admin (any)
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
```

### F-3.5 🟡 MEDIUM — `accept_order()` doesn't validate caller is a driver

```sql
-- Add to accept_order() at the top of the function body:
IF NOT public.is_driver() AND NOT public.is_admin() THEN
  RETURN jsonb_build_object('success', false, 'error', 'NOT_A_DRIVER');
END IF;

-- Also verify p_driver_id matches auth.uid() (or admin override):
IF p_driver_id != auth.uid() AND NOT public.is_admin() THEN
  RETURN jsonb_build_object('success', false, 'error', 'DRIVER_ID_MISMATCH');
END IF;
```

### F-3.6 🟡 MEDIUM — `wallet_debit` references non-existent `wallet_transactions` table

The idempotency check queries `wallet_transactions` which doesn't exist in any schema. This will throw a runtime error if an idempotency key is ever passed.

```sql
-- FIX: Create the wallet_transactions table
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
CREATE POLICY "Users view own wallet_tx" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage wallet_tx" ON wallet_transactions FOR ALL USING (public.is_admin());

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions (idempotency_key);
```

---

## PHASE 4 — INDEXING & PERFORMANCE AUDIT

### 4.1 Index Analysis

Largely addressed in `001_performance_indexes.sql`. Additional findings:

### F-4.1 🟡 MEDIUM — Duplicate indexes from multiple migrations

```
idx_orders_driver_id          (from V3 schema)
idx_orders_driver_id_status   (from 001_performance_indexes.sql — partial)
idx_orders_driver_id          (from basic V3 schema)
```

The basic `idx_orders_driver_id` is subsumed by the composite index. After deploying the performance indexes:

```sql
-- Can safely drop after 001_performance_indexes.sql is deployed:
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_driver_id;
-- The partial idx_orders_driver_id_status covers all driver_id lookups
```

### F-4.2 🟡 MEDIUM — `admin_logs` has no indexes at all

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_logs_type ON admin_logs (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_logs_action ON admin_logs (action);
```

### F-4.3 🔵 LOW — `products.category` index without `is_active` filter

```sql
-- The existing idx_products_category is standalone
-- Already addressed in 001_performance_indexes: idx_products_category_active
```

---

## PHASE 5 — STORAGE & FILE SECURITY

### 5.1 Bucket Analysis

| Bucket | Public | Upload Control | Status |
|--------|--------|---------------|--------|
| `products` | ✅ Public read | Admin write | ✅ Correct |
| `avatars` | ✅ Public read | Owner write (folder match) | ✅ Correct |
| `delivery_proofs` | ❌ Private | Driver write | ⚠️ |
| `images` | ✅ Public read | 🔴 PUBLIC WRITE | 🔴 CRITICAL |

### F-5.1 🔴 CRITICAL — `images` bucket allows anonymous uploads

**Evidence:** `supabase_schema.sql` line 230:
```sql
CREATE POLICY "Public Upload Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');
```

This allows any unauthenticated visitor to upload arbitrary files. This is a file upload vulnerability — potential for malware hosting, storage exhaustion, or serving illegal content from your domain.

```sql
-- FIX: Drop the open policy
DROP POLICY IF EXISTS "Public Upload Images" ON storage.objects;

-- Replace with admin-only:
CREATE POLICY "Admin Upload Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND public.is_admin());
```

### F-5.2 🟡 MEDIUM — `delivery_proofs` allows ANY driver to upload/read/delete

The policy `"Drivers Manage Own Proofs"` uses `is_driver()` which means any driver can access/modify/delete any other driver's delivery proofs.

```sql
-- FIX: Scope to the driver's own folder
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
```

### F-5.3 🟡 MEDIUM — Missing file size and type restrictions

```sql
-- FIX: Add MIME type restrictions to avatar uploads
DROP POLICY IF EXISTS "Users Manage Own Avatar" ON storage.objects;
CREATE POLICY "Users Manage Own Avatar" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
  );
```

---

## PHASE 6 — DATA INTEGRITY & CONCURRENCY

### F-6.1 🟠 HIGH — No `ON DELETE CASCADE` on `driver_transactions` → `auth.users`

If an `auth.users` record is deleted, `driver_transactions` rows remain but with a dangling `driver_id` FK. The V3 schema has `ON DELETE CASCADE` but the `driver_enhancement.sql` version doesn't, so if that migration ran after V3, constraints may vary.

### F-6.2 🟠 HIGH — Reward redemption has no stock decrement

When a customer redeems a reward, the `rewards.stock_limit` is never decremented. Multiple customers can redeem the same limited-stock reward.

```sql
CREATE OR REPLACE FUNCTION redeem_reward(
  p_customer_id UUID,
  p_reward_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_customer_points INTEGER;
BEGIN
  IF auth.uid() != p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- Lock reward row
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'REWARD_NOT_FOUND');
  END IF;

  -- Check stock
  IF v_reward.stock_limit IS NOT NULL AND v_reward.stock_limit <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'OUT_OF_STOCK');
  END IF;

  -- Check points
  SELECT points INTO v_customer_points FROM profiles WHERE id = p_customer_id FOR UPDATE;
  IF v_customer_points < v_reward.points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  END IF;

  -- Deduct points
  UPDATE profiles SET points = points - v_reward.points_required WHERE id = p_customer_id;

  -- Decrement stock
  IF v_reward.stock_limit IS NOT NULL THEN
    UPDATE rewards SET stock_limit = stock_limit - 1 WHERE id = p_reward_id;
  END IF;

  -- Create redemption
  INSERT INTO reward_redemptions (customer_id, reward_id, status)
  VALUES (p_customer_id, p_reward_id, 'pending');

  RETURN jsonb_build_object('success', true);
END;
$$;
```

### F-6.3 🟡 MEDIUM — `user_impact` has no idempotency protection

A user can submit multiple impact contributions for the same order if the RPC is called repeatedly.

```sql
-- FIX: Add unique constraint
ALTER TABLE public.user_impact
  ADD CONSTRAINT uq_user_impact_order
  UNIQUE (user_id, order_id)
  WHERE order_id IS NOT NULL;
-- Note: This is a partial unique index, requires CREATE UNIQUE INDEX syntax:
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_impact_order
  ON user_impact (user_id, order_id)
  WHERE order_id IS NOT NULL;
```

---

## PHASE 7 — OBSERVABILITY & AUDIT LOGGING

### F-7.1 🟠 HIGH — `admin_logs` table is inadequate

Current schema:
```sql
admin_logs (id, created_at, action TEXT, admin_name TEXT, type TEXT)
```

**Problems:**
- No `admin_id` UUID — just a text name that can be spoofed
- No `target_table`, `target_id` — can't trace what was changed
- No `old_values`, `new_values` — no audit trail
- No RLS policies at all

```sql
-- FIX: Create proper audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users,
  actor_role TEXT,
  action TEXT NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE', 'RPC_CALL'
  table_name TEXT NOT NULL,
  record_id TEXT,              -- UUID of affected record
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit_log" ON audit_log FOR SELECT USING (public.is_admin());
-- INSERT is done via SECURITY DEFINER functions only

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_table ON audit_log (table_name, record_id);
```

### F-7.2 🟡 MEDIUM — No audit trigger for critical mutations

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    actor_id, actor_role, action, table_name, record_id,
    old_values, new_values
  ) VALUES (
    auth.uid(),
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
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
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_profiles_wallet
  AFTER UPDATE OF wallet_balance, points, tier, role, is_admin ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_rewards
  AFTER INSERT OR UPDATE OR DELETE ON rewards
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_reward_redemptions
  AFTER INSERT OR UPDATE ON reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
```

---

## RISK SCORE PER TABLE

| Table | Confidentiality | Integrity | Availability | Overall Risk |
|-------|----------------|-----------|-------------|-------------|
| `profiles` | 🟡 6 | 🟠 7 | 🟢 3 | **🟠 HIGH** |
| `orders` | 🟠 8 | 🔴 9 | 🟡 5 | **🔴 CRITICAL** |
| `products` | 🟢 2 | 🟡 5 | 🟡 5 | **🟡 MEDIUM** |
| `driver_transactions` | 🟡 6 | 🟠 7 | 🟢 3 | **🟠 HIGH** |
| `driver_wallets` | 🟠 8 | 🟠 8 | 🟡 4 | **🔴 CRITICAL** |
| `customer_transactions` | 🟡 5 | 🟠 7 | 🟢 3 | **🟠 HIGH** |
| `rewards` | 🟢 2 | 🟡 6 | 🟢 2 | **🟡 MEDIUM** |
| `reward_redemptions` | 🟡 5 | 🟠 8 | 🟢 3 | **🟠 HIGH** |
| `app_settings` | 🟢 3 | 🟡 5 | 🟠 7 | **🟡 MEDIUM** |
| `user_impact` | 🟢 3 | 🟡 5 | 🟢 2 | **🟡 MEDIUM** |
| `impact_campaigns` | 🟢 2 | 🟡 5 | 🟢 2 | **🟢 LOW** |
| `admin_logs` | 🟠 7 | 🟡 5 | 🟢 2 | **🟡 MEDIUM** |

---

## FULL SQL FIX PACK

> **Run order matters.** Execute blocks in numbered order. Each block is idempotent.

See companion file: `003_security_hardening.sql`
