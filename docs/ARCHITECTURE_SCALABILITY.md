# ARCHITECTURE: Scalability Roadmap & Risk Assessment
## Yalla Wasel - Horizontal Scaling Strategy
### From Monolith → Domain-Separated → Microservices

---

## 1. CURRENT STATE ANALYSIS

### Architecture Profile
```
┌─────────────────────────────────────────────┐
│              Client Layer (PWAs)             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Main App (PWA)  │  │  Driver App (PWA) │  │
│  └────────┬────────┘  └────────┬─────────┘  │
│           │                     │            │
│           ▼                     ▼            │
│  ┌──────────────────────────────────────┐   │
│  │       Supabase JS Client             │   │
│  │  (Direct DB access via PostgREST)    │   │
│  └────────────────┬─────────────────────┘   │
└───────────────────┼─────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│               Supabase Platform              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ PostgREST│ │ Auth(GoT)│ │  Realtime    │  │
│  └────┬─────┘ └──────────┘ └──────┬──────┘  │
│       ▼                           ▼          │
│  ┌──────────────────────────────────────┐    │
│  │         PostgreSQL 15+               │    │
│  │  (orders, profiles, products, etc.)  │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Identified Coupling Risks (Monolithic)

| Risk | Severity | Current Impact | Mitigation |
|------|----------|---------------|------------|
| Single DB for all domains | HIGH | All queries compete for connections | Connection pooling (PgBouncer) |
| Direct client→DB without API layer | HIGH | No request throttling/shaping | RPC functions + rate limiting |
| Shared `profiles` table for auth + driver + wallet | MEDIUM | Schema changes affect all domains | Domain-specific views |
| Real-time on all tables | MEDIUM | Broadcast amplification | Scoped channels |
| No background job queue | MEDIUM | Slow operations block UI | Edge Functions |
| LocalStorage for state | LOW | PWA-specific, no cross-device | Acceptable at current scale |

---

## 2. DOMAIN SEPARATION MAP

### Bounded Contexts

```
┌──────────────────────────────────────────────────────────────┐
│                      YALLA WASEL DOMAINS                     │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   ORDERS   │  │  DRIVERS   │  │   WALLET   │            │
│  │            │  │            │  │            │            │
│  │ orders     │  │ profiles   │  │ profiles   │            │
│  │ order_     │  │ (driver    │  │ (wallet_   │            │
│  │ status_    │  │  subset)   │  │  balance)  │            │
│  │ history    │  │ driver_    │  │ wallet_    │            │
│  │ items[]    │  │ trans-     │  │ trans-     │            │
│  │            │  │ actions    │  │ actions    │            │
│  └────────────┘  │ goals      │  └────────────┘            │
│                  │ achiev.    │                              │
│  ┌────────────┐  └────────────┘  ┌────────────┐            │
│  │   IMPACT   │                  │   ADMIN    │            │
│  │            │  ┌────────────┐  │            │            │
│  │ campaigns  │  │  CATALOG   │  │ admin_logs │            │
│  │ user_      │  │            │  │ settings   │            │
│  │ impact     │  │ products   │  │ chart_     │            │
│  │ leaderb.   │  │ happy_hrs  │  │ settings   │            │
│  └────────────┘  │ rewards    │  │ delivery   │            │
│                  │ live_offers│  └────────────┘            │
│                  └────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

### Inter-Domain Dependencies

```
ORDERS ──references──▶ CATALOG (product prices)
ORDERS ──triggers───▶ WALLET (payment debit)
ORDERS ──triggers───▶ IMPACT (contribution calculation)
ORDERS ──triggers───▶ DRIVERS (assignment)
DRIVERS ──reads─────▶ ORDERS (active deliveries)
IMPACT ──reads──────▶ ORDERS (order total for %)
ADMIN ──manages─────▶ ALL DOMAINS (CRUD)
```

---

## 3. EVOLUTION ROADMAP

### Phase A: Current (Monolith) — ✅ In Progress
**Focus**: Optimize what exists without breaking changes.

- [x] Zod runtime validation
- [x] Performance indexes (SQL)
- [x] Atomic RPCs (transaction safety)
- [x] Client-side caching layer
- [x] Resilience utilities
- [x] Observability/telemetry
- [ ] Apply caching to service layer calls
- [ ] Wire resilience into API calls
- [ ] Deploy SQL migrations to Supabase

**Estimated scale**: 0 → 10k users

---

### Phase B: Optimized Monolith (3-6 months)
**Focus**: Squeeze maximum performance from Supabase.

#### Actions:
1. **Enable PgBouncer** in Supabase (connection pooling)
   - Prevents connection exhaustion at 500+ concurrent users
   - Config: `pool_mode=transaction`, `max_client_conn=200`

2. **Read Replicas** (Supabase Pro plan)
   - Route all read queries (products, settings, leaderboard) to replica
   - Keep writes on primary

3. **Supabase Edge Functions** for compute-heavy operations:
   - Order impact calculation
   - Leaderboard aggregation
   - Report generation
   - WhatsApp notifications

4. **CDN for Static Assets**
   - Product images → Supabase Storage with CDN
   - PWA assets → Vercel/Cloudflare Edge

5. **Database Partitioning**
   - `orders` table: range partition by `created_at` (monthly)
   - `driver_transactions`: range partition by `created_at`
   - `order_status_history`: range partition by `created_at`

**Estimated scale**: 10k → 50k users

---

### Phase C: Domain Separation (6-12 months)
**Focus**: Logical separation within Supabase, preparing for extraction.

#### Database Schema Evolution:
```sql
-- Create domain-specific schemas
CREATE SCHEMA IF NOT EXISTS orders_domain;
CREATE SCHEMA IF NOT EXISTS drivers_domain;
CREATE SCHEMA IF NOT EXISTS wallet_domain;
CREATE SCHEMA IF NOT EXISTS impact_domain;
CREATE SCHEMA IF NOT EXISTS catalog_domain;

-- Move tables to domain schemas (with views in public for backward compat)
ALTER TABLE orders SET SCHEMA orders_domain;
CREATE VIEW public.orders AS SELECT * FROM orders_domain.orders;

-- Domain-specific RLS policies
-- Each domain manages its own access control
```

#### Service Layer Refactoring:
```
/src/services/
  ├── domains/
  │   ├── orders/
  │   │   ├── ordersService.ts      <- All order logic
  │   │   ├── ordersCache.ts        <- Order-specific caching
  │   │   └── ordersEvents.ts       <- Order domain events
  │   ├── drivers/
  │   │   ├── driversService.ts
  │   │   ├── driversCache.ts
  │   │   └── driversEvents.ts
  │   ├── wallet/
  │   ├── impact/
  │   └── catalog/
  ├── shared/
  │   ├── supabaseClient.ts
  │   ├── resilience.ts
  │   ├── cache.ts
  │   ├── telemetry.ts
  │   └── logger.ts
  └── events/
      └── domainEventBus.ts         <- In-process event bus
```

**Estimated scale**: 50k → 100k users

---

### Phase D: Microservice Extraction (12-24 months)
**Focus**: True horizontal scaling with independent services.

```
                    ┌─────────────┐
                    │   API       │
                    │   Gateway   │
                    │ (Cloudflare │
                    │  Workers)   │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │  Orders    │ │  Drivers   │ │  Wallet    │
     │  Service   │ │  Service   │ │  Service   │
     │  (Edge Fn) │ │  (Edge Fn) │ │  (Edge Fn) │
     └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
           │               │              │
           ▼               ▼              ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │ Orders DB  │ │ Drivers DB │ │ Wallet DB  │
     │ (Supabase  │ │ (Supabase  │ │ (Supabase  │
     │  Project)  │ │  Project)  │ │  Project)  │
     └────────────┘ └────────────┘ └────────────┘
           │               │              │
           └───────────────┼──────────────┘
                           ▼
                    ┌────────────┐
                    │   Event    │
                    │   Bus      │
                    │  (Redis    │
                    │  Streams)  │
                    └────────────┘
```

#### Event-Driven Architecture:
```typescript
// Domain events replace direct cross-domain calls
interface OrderDeliveredEvent {
  type: 'order.delivered';
  orderId: string;
  userId: string;
  driverId: string;
  total: number;
  timestamp: string;
}

// Listeners (async, decoupled):
// - WalletService: process payment
// - ImpactService: calculate contribution
// - DriversService: update stats
// - NotificationService: send confirmation
```

**Estimated scale**: 100k+ users

---

## 4. DATA LIFECYCLE MANAGEMENT (Phase 7)

### Retention Policy
| Data | Hot Storage | Archive After | Delete After |
|------|------------|---------------|--------------|
| Active Orders | Real-time | 90 days (delivered/cancelled) | 3 years |
| Order History | 90 days | Beyond 90 days | 5 years |
| Driver Transactions | 30 days | Beyond 30 days | 7 years (legal) |
| User Impact | Indefinite | Never | Never |
| Admin Logs | 30 days | Beyond 30 days | 1 year |
| Live Offer History | 7 days | Beyond 7 days | 90 days |

### Archival Strategy
```sql
-- Run via pg_cron every night at 02:00 UTC
-- SELECT cron.schedule('archive_orders', '0 2 * * *',
--   'SELECT archive_old_orders(90)');

-- For driver_transactions:
-- SELECT cron.schedule('archive_transactions', '0 3 * * *',
--   $$
--     WITH moved AS (
--       DELETE FROM driver_transactions
--       WHERE created_at < NOW() - INTERVAL '30 days'
--       RETURNING *
--     )
--     INSERT INTO driver_transactions_archive SELECT * FROM moved
--   $$
-- );
```

### Table Size Monitoring
```sql
-- Query to check table sizes (run periodically)
SELECT
  schemaname,
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## 5. COST & EFFICIENCY OPTIMIZATION (Phase 8)

### Current Inefficiencies Identified

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| `SELECT *` on profiles | `useAuth.ts`, `DriverAuthContext` | Fetches 20+ columns when only 5 needed | Select specific columns |
| N+1 in leaderboard | `impactService.getLeaderboard()` | Fetches all impacts, then profiles | Use materialized view |
| Unbounded realtime channels | `useProducts.ts` | Re-fetches all products on any change | Debounce + partial update |
| Full re-fetch on mutation | `DriverDashboard.updateOrder()` | Calls fetchOrders() after every status change | Optimistic update |
| Settings fetched every mount | `SettingsContext` | Multiple components trigger fetch | Cache (COLD tier) |
| `count: "exact"` queries | `driverStatsService` | Forces full table scan for count | Use partial index |

### Optimized Query Patterns

```typescript
// BEFORE: Select * (fetches all 20+ columns)
const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();

// AFTER: Select only needed columns
const { data } = await supabase
  .from("profiles")
  .select("id, full_name, phone, address, wallet_balance, points, tier, is_admin, created_at")
  .eq("id", userId)
  .single();
```

```typescript
// BEFORE: N+1 leaderboard
const impacts = await supabase.from("user_impact").select("*");
// Then loop and fetch profile for each...

// AFTER: Use materialized view (created in 001_performance_indexes.sql)
const { data } = await supabase
  .from("mv_impact_leaderboard")
  .select("user_id, total_impact_units, total_contributed, contribution_count")
  .order("total_impact_units", { ascending: false })
  .limit(10);
```

### Real-time Subscription Optimization

```typescript
// BEFORE: Wildcard subscription re-fetches everything
supabase
  .channel("products_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
    // Full re-fetch of ALL products
    supabase.from("products").select("*").eq("is_active", true);
  });

// AFTER: Use the payload directly for targeted updates
supabase
  .channel("products_changes")
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, (payload) => {
    // Update only the changed product in state
    setProducts(prev => prev.map(p =>
      p.id === payload.new.id ? mapProduct(payload.new) : p
    ));
    cache.invalidate(CACHE_KEYS.PRODUCTS_ACTIVE);
  })
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, (payload) => {
    if (payload.new.is_active) {
      setProducts(prev => [...prev, mapProduct(payload.new)]);
    }
    cache.invalidate(CACHE_KEYS.PRODUCTS_ACTIVE);
  });
```

### Infrastructure Cost Model

| Scale | Supabase Plan | Estimated Monthly Cost | Key Limits |
|-------|--------------|----------------------|------------|
| 0-5k users | Pro ($25) | $25-50 | 8GB DB, 250MB storage |
| 5k-25k | Pro + add-ons | $100-250 | Read replica, larger DB |
| 25k-50k | Team ($599) | $600-1000 | Higher limits, priority support |
| 50k-100k | Enterprise | $2000-5000 | Custom limits, SLA |
| 100k+ | Multi-project | $5000+ | Microservice architecture |

---

## 6. RISK ASSESSMENT MATRIX

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| DB connection exhaustion | HIGH at >1k concurrent | Service outage | PgBouncer, connection limits |
| Race condition on order accept | HIGH without RPCs | Double-assignment | Atomic `accept_order` RPC |
| Realtime channel storms | MEDIUM at >5k users | Memory pressure | Scoped channels, debounce |
| LocalStorage overflow | LOW | Cache failures | Max entry limits, try/catch |
| Single point of failure (Supabase) | LOW (SLA) | Total outage | Offline queue, fallbacks |
| Schema migration errors | MEDIUM | Data corruption | IF NOT EXISTS, CONCURRENTLY |
| Unbounded table growth | HIGH over 12+ months | Slow queries | Archival, partitioning |

---

## 7. IMPLEMENTATION PRIORITY

### Immediate (This Session) ✅
1. Database indexes → `001_performance_indexes.sql`
2. Atomic RPCs → `002_transaction_safety.sql`
3. Resilience layer → `src/services/resilience.ts`
4. Observability → `src/services/telemetry.ts`
5. Caching layer → `src/services/cache.ts`

### Next Sprint (1-2 weeks)
6. Wire caching into service layer calls
7. Wire resilience into critical API paths
8. Apply SQL migrations to Supabase
9. Remove `SELECT *` from all queries
10. Optimize real-time subscriptions

### Near-term (1-3 months)
11. Enable PgBouncer
12. Move compute to Edge Functions
13. Implement background job queue
14. Set up archival cron jobs

### Strategic (3-12 months)
15. Domain schema separation
16. Event bus implementation
17. Read replicas
18. Table partitioning
19. Microservice extraction planning
