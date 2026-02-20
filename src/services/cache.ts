/**
 * CACHING LAYER
 * ==============
 * Client-side intelligent cache with TTL, stale-while-revalidate,
 * and memory-bounded eviction.
 *
 * Architecture:
 * - L1: In-memory (instant, session-scoped)
 * - L2: SessionStorage (survives re-renders, tab-scoped)
 * - L3: LocalStorage (survives page reloads, device-scoped)
 *
 * Future: L4 → Redis/Edge cache (Supabase Edge Functions)
 *
 * TTL Tiers:
 * - HOT:    30s   (orders, driver location, live offers)
 * - WARM:   5min  (products, happy hours, campaigns)
 * - COLD:   30min (settings, categories, delivery zones)
 * - FROZEN: 24h   (static config, badge definitions)
 *
 * Patterns:
 * - Cache-aside (read-through)
 * - Stale-while-revalidate
 * - Write-through invalidation
 */

import { logger } from "@/services/logger";

// ============================================
// TYPES
// ============================================

export type CacheTier = "HOT" | "WARM" | "COLD" | "FROZEN";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttlMs: number;
    key: string;
    tier: CacheTier;
}

interface CacheConfig {
    /** Maximum number of entries in L1 memory cache */
    maxL1Entries: number;
    /** Whether to persist to L2 (sessionStorage) */
    enableL2: boolean;
    /** Whether to persist to L3 (localStorage) */
    enableL3: boolean;
}

// ============================================
// TTL DEFINITIONS
// ============================================

export const CACHE_TTL: Record<CacheTier, number> = {
    HOT: 30 * 1000,          // 30 seconds
    WARM: 5 * 60 * 1000,     // 5 minutes
    COLD: 30 * 60 * 1000,    // 30 minutes
    FROZEN: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================
// CACHE KEY REGISTRY
// ============================================

/**
 * Centralized key registry to prevent collisions
 * and document what each key stores.
 */
export const CACHE_KEYS = {
    // HOT tier
    ORDERS_LIST: "orders:list",
    ORDERS_BY_ID: (id: string) => `orders:${id}`,
    DRIVER_ORDERS: (driverId: string) => `driver:orders:${driverId}`,
    LIVE_OFFERS: "live_offers:list",

    // WARM tier
    PRODUCTS_ACTIVE: "products:active",
    PRODUCTS_ALL: "products:all",
    HAPPY_HOURS_ACTIVE: "happy_hours:active",
    IMPACT_CAMPAIGNS_ACTIVE: "campaigns:active",
    LEADERBOARD: "impact:leaderboard",
    USER_IMPACT: (userId: string) => `impact:user:${userId}`,
    DAILY_STATS: (driverId: string) => `driver:stats:${driverId}`,

    // COLD tier
    APP_SETTINGS: "settings:app",
    DELIVERY_CONFIG: "delivery:config",
    CHART_SETTINGS: "chart:settings",

    // FROZEN tier
    CATEGORIES: "static:categories",
    BADGE_DEFINITIONS: "static:badges",
} as const;

// ============================================
// DATA CLASSIFICATION
// ============================================

/**
 * Maps operations to their cache tier.
 * Used by the cache-aside wrapper.
 */
export const DATA_CLASSIFICATION: Record<string, CacheTier> = {
    // HOT — changes frequently, needs near-real-time
    "OrdersAPI.getAll": "HOT",
    "OrdersAPI.getById": "HOT",
    "DriverDashboard.fetchOrders": "HOT",
    "ChartService.getLiveOffers": "HOT",

    // WARM — changes occasionally
    "ProductsAPI.getAll": "WARM",
    "HappyHoursAPI.getActive": "WARM",
    "ImpactAPI.getActive": "WARM",
    "getUserImpactStats": "WARM",
    "getLeaderboard": "WARM",
    "getDailyStats": "WARM",

    // COLD — changes rarely
    "SettingsService.getSettings": "COLD",
    "DeliveryService.getConfig": "COLD",
    "ChartService.getSettings": "COLD",

    // FROZEN — essentially static
    "CATEGORIES": "FROZEN",
    "BADGE_DEFINITIONS": "FROZEN",
};

// ============================================
// CACHE IMPLEMENTATION
// ============================================

class CacheLayer {
    private l1: Map<string, CacheEntry<unknown>> = new Map();
    private readonly config: CacheConfig;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            maxL1Entries: config.maxL1Entries ?? 200,
            enableL2: config.enableL2 ?? true,
            enableL3: config.enableL3 ?? true,
        };
    }

    /**
     * Get from cache (L1 → L2 → L3 fallthrough)
     */
    get<T>(key: string): T | null {
        // L1: Memory
        const l1Entry = this.l1.get(key) as CacheEntry<T> | undefined;
        if (l1Entry && !this.isExpired(l1Entry)) {
            return l1Entry.data;
        }

        // L2: SessionStorage
        if (this.config.enableL2) {
            const l2Data = this.readStorage(sessionStorage, key);
            if (l2Data && !this.isExpired(l2Data)) {
                // Promote to L1
                this.l1.set(key, l2Data);
                return l2Data.data as T;
            }
        }

        // L3: LocalStorage (only for COLD/FROZEN tiers)
        if (this.config.enableL3) {
            const l3Data = this.readStorage(localStorage, key);
            if (l3Data && !this.isExpired(l3Data)) {
                // Promote to L1 + L2
                this.l1.set(key, l3Data);
                if (this.config.enableL2) {
                    this.writeStorage(sessionStorage, key, l3Data);
                }
                return l3Data.data as T;
            }
        }

        // Cache miss — clean up expired entries
        this.l1.delete(key);
        return null;
    }

    /**
     * Set value in cache at specified tier
     */
    set<T>(key: string, data: T, tier: CacheTier = "WARM"): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttlMs: CACHE_TTL[tier],
            key,
            tier,
        };

        // Always set in L1
        this.l1.set(key, entry as CacheEntry<unknown>);
        this.enforceSizeLimit();

        // L2 for WARM+ tiers
        if (this.config.enableL2 && tier !== "HOT") {
            this.writeStorage(sessionStorage, key, entry);
        }

        // L3 only for COLD/FROZEN
        if (this.config.enableL3 && (tier === "COLD" || tier === "FROZEN")) {
            this.writeStorage(localStorage, key, entry);
        }
    }

    /**
     * Cache-aside pattern: get from cache or fetch from source.
     *
     * @example
     * const products = await cache.getOrFetch(
     *   CACHE_KEYS.PRODUCTS_ACTIVE,
     *   () => supabase.from('products').select('*'),
     *   'WARM'
     * );
     */
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        tier: CacheTier = "WARM"
    ): Promise<T> {
        // Try cache first
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss: fetch, store, return
        const data = await fetcher();
        this.set(key, data, tier);
        return data;
    }

    /**
     * Stale-while-revalidate: return stale data immediately,
     * refresh in background.
     */
    async staleWhileRevalidate<T>(
        key: string,
        fetcher: () => Promise<T>,
        tier: CacheTier = "WARM"
    ): Promise<T> {
        const cached = this.get<T>(key);

        if (cached !== null) {
            // Return stale data immediately, refresh in background
            this.refreshInBackground(key, fetcher, tier);
            return cached;
        }

        // No cached data — must wait for fresh fetch
        return this.getOrFetch(key, fetcher, tier);
    }

    /**
     * Invalidate a specific key or pattern
     */
    invalidate(keyOrPattern: string): void {
        if (keyOrPattern.includes("*")) {
            // Pattern invalidation: delete all matching keys
            const pattern = keyOrPattern.replace(/\*/g, "");
            const keysToDelete: string[] = [];
            for (const key of this.l1.keys()) {
                if (key.startsWith(pattern)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach((k) => {
                this.l1.delete(k);
                this.removeFromStorage(k);
            });
            logger.debug(`[Cache] Invalidated ${keysToDelete.length} keys matching: ${keyOrPattern}`);
        } else {
            this.l1.delete(keyOrPattern);
            this.removeFromStorage(keyOrPattern);
        }
    }

    /**
     * Invalidate all entries for a specific tier
     */
    invalidateTier(tier: CacheTier): void {
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.l1.entries()) {
            if ((entry as CacheEntry<unknown>).tier === tier) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((k) => this.invalidate(k));
        logger.debug(`[Cache] Invalidated ${keysToDelete.length} entries in tier: ${tier}`);
    }

    /**
     * Clear all cache layers
     */
    clear(): void {
        this.l1.clear();
        logger.info("[Cache] All layers cleared");
    }

    /**
     * Get cache stats for debugging
     */
    getStats(): Record<string, unknown> {
        const tierCounts: Record<CacheTier, number> = {
            HOT: 0,
            WARM: 0,
            COLD: 0,
            FROZEN: 0,
        };

        for (const entry of this.l1.values()) {
            tierCounts[(entry as CacheEntry<unknown>).tier]++;
        }

        return {
            l1Size: this.l1.size,
            maxL1: this.config.maxL1Entries,
            tiers: tierCounts,
        };
    }

    // ======== PRIVATE ========

    private isExpired(entry: CacheEntry<unknown>): boolean {
        return Date.now() - entry.timestamp > entry.ttlMs;
    }

    private enforceSizeLimit(): void {
        if (this.l1.size <= this.config.maxL1Entries) return;

        // LRU-like eviction: remove oldest entries by timestamp
        const entries = Array.from(this.l1.entries())
            .sort((a, b) =>
                (a[1] as CacheEntry<unknown>).timestamp - (b[1] as CacheEntry<unknown>).timestamp
            );

        const excess = this.l1.size - this.config.maxL1Entries;
        for (let i = 0; i < excess; i++) {
            this.l1.delete(entries[i][0]);
        }
    }

    private refreshInBackground<T>(
        key: string,
        fetcher: () => Promise<T>,
        tier: CacheTier
    ): void {
        fetcher()
            .then((data) => this.set(key, data, tier))
            .catch((err) => logger.warn(`[Cache] Background refresh failed for: ${key}`, err));
    }

    private readStorage(
        storage: Storage,
        key: string
    ): CacheEntry<unknown> | null {
        try {
            const raw = storage.getItem(`cache:${key}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    private writeStorage(
        storage: Storage,
        key: string,
        entry: CacheEntry<unknown>
    ): void {
        try {
            storage.setItem(`cache:${key}`, JSON.stringify(entry));
        } catch {
            // Storage full — fail silently
        }
    }

    private removeFromStorage(key: string): void {
        try {
            sessionStorage.removeItem(`cache:${key}`);
            localStorage.removeItem(`cache:${key}`);
        } catch {
            // Fail silently
        }
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const cache = new CacheLayer();

// ============================================
// WRITE-THROUGH INVALIDATION HELPERS
// ============================================

/**
 * Invalidate cache when data is written.
 * Call after any mutation to ensure stale reads don't happen.
 *
 * @example
 * await OrdersAPI.create(order);
 * invalidateOnWrite('orders');
 */
export function invalidateOnWrite(
    domain: "orders" | "products" | "settings" | "happyhours" | "campaigns" | "impact" | "delivery"
): void {
    const invalidationMap: Record<string, string[]> = {
        orders: [
            CACHE_KEYS.ORDERS_LIST,
            "orders:*",
            "driver:orders:*",
            "driver:stats:*",
        ],
        products: [
            CACHE_KEYS.PRODUCTS_ACTIVE,
            CACHE_KEYS.PRODUCTS_ALL,
        ],
        settings: [
            CACHE_KEYS.APP_SETTINGS,
        ],
        happyhours: [
            CACHE_KEYS.HAPPY_HOURS_ACTIVE,
        ],
        campaigns: [
            CACHE_KEYS.IMPACT_CAMPAIGNS_ACTIVE,
            CACHE_KEYS.LEADERBOARD,
        ],
        impact: [
            CACHE_KEYS.LEADERBOARD,
            "impact:user:*",
        ],
        delivery: [
            CACHE_KEYS.DELIVERY_CONFIG,
        ],
    };

    const keys = invalidationMap[domain] || [];
    for (const key of keys) {
        cache.invalidate(key);
    }
}
