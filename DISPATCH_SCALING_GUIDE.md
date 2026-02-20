# Enterprise Dispatch Scaling & Reliability Guide

This document outlines the architectural upgrades implemented to scale the dispatch system to 1,000+ concurrent drivers with zero race conditions and offline tolerance.

## 1. Automated Order Lifecycle Management

### Expiration System
Orders now include an `expires_at` timestamp (default: 2 minutes). 
- **Database**: `orders` table has `expires_at` and `expired` columns.
- **Worker**: The `expire_orders()` Postgres function processes stale orders.
- **UI Integration**: Driver apps listen for `UPDATE` events and automatically remove expired orders from the feed.

### Geo-Spatial Radius Matching
Optimized driver discovery using the `earthdistance` extension.
- **`nearby_drivers(order_id, radius_km)`**: Returns online drivers who have checked in within the last 60 seconds (Heartbeat) and are within the specified radius.

## 2. Dynamic Driver State & Heartbeat

- **Heartbeat System**: Driver PWA sends a pulse every 20 seconds updating `is_online`, `last_seen`, and `lat/lng`.
- **Load Safety**: Dispatch logic only considers drivers who have a "live" heartbeat (last seen < 1 min ago).
- **Status Persistence**: Drivers are automatically marked offline on logout or extended inactivity.

## 3. Advanced Offline Resilience

### IndexedDB Operational Queue
Implemented an offline queue in `apps/driver/src/services/offlineQueue.ts`:
- **Accept Click Capture**: If a driver clicks "Accept Job" while offline, the intent is stored in IndexedDB.
- **Auto-Reconciliation**: Upon network recovery, the queue is processed. If the order is still available, it is accepted; otherwise, it is gracefully cleared.

### Reconciliation Strategy
- **Client-Side Sync**: Every 60 seconds, the driver app performs a lightweight refetch of current assignments to resolve any drift between the real-time feed and server state.

## 4. Scalability Logic (Edge Functions)

To scale `auto_assign` without blocking the main DB, use the following Supabase Edge Function logic:

```typescript
// supabase/functions/auto-dispatch/index.ts
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { order_id } = await req.json()
  const supabase = createClient(...)

  // Wait 15 seconds for manual acceptance
  await new Promise(res => setTimeout(res, 15000))

  // Check if still pending
  const { data: order } = await supabase.from('orders').select('status').eq('id', order_id).single()
  
  if (order?.status === 'pending') {
    // Trigger Auto-Assign RPC
    await supabase.rpc('auto_assign', { order_uuid: order_id })
  }

  return new Response("OK")
})
```

## 5. Security & RLS Hardening

- **No Overwrites**: Drivers can only update orders that are `pending` AND `expired = false`.
- **Strict Ownership**: RLS policies prevent drivers from viewing orders assigned to others or customer-sensitive metadata outside their delivery scope.
- **Atomic Operations**: All status transitions must go through validated RPCs (`accept_order`, `auto_assign`) to prevent double-assignments.
