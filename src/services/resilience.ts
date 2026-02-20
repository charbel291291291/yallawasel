/**
 * RESILIENCE LAYER
 * ================
 * Production-grade fault tolerance utilities for the service layer.
 *
 * Components:
 * - RetryWithBackoff: Exponential backoff with jitter
 * - CircuitBreaker: Prevents cascading failures
 * - withTimeout: Network timeout boundaries
 * - OfflineQueue: Queues mutations when offline
 *
 * Design decisions:
 * - Generic over Supabase — works with any async operation
 * - No external dependencies (no axios-retry, etc.)
 * - Configurable per-operation, not globally
 * - Integrates with existing logger
 */

import { logger } from "@/services/logger";

// ============================================
// TYPES
// ============================================

export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Base delay in milliseconds */
    baseDelayMs: number;
    /** Maximum delay cap in milliseconds */
    maxDelayMs: number;
    /** Whether to add jitter to prevent thundering herd */
    jitter: boolean;
    /** Predicate to decide if error is retryable */
    isRetryable?: (error: unknown) => boolean;
}

export interface CircuitBreakerConfig {
    /** Number of failures before opening */
    failureThreshold: number;
    /** Time to wait before half-opening (ms) */
    resetTimeoutMs: number;
    /** Number of successes in half-open to close */
    successThreshold: number;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface QueuedAction {
    id: string;
    operation: string;
    payload: unknown;
    timestamp: number;
    retryCount: number;
}

// ============================================
// DEFAULT CONFIGS
// ============================================

const DEFAULT_RETRY: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 10000,
    jitter: true,
    isRetryable: (error: unknown) => {
        // Retry on network errors, rate limits, server errors
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) return true;
            if (msg.includes("429") || msg.includes("rate limit")) return true;
            if (msg.includes("500") || msg.includes("502") || msg.includes("503")) return true;
        }
        // Supabase error object
        if (typeof error === "object" && error !== null && "code" in error) {
            const code = (error as { code: string }).code;
            return code === "PGRST301" || code === "20" || code === "57014";
        }
        return false;
    },
};

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 30000, // 30 seconds
    successThreshold: 2,
};

// ============================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================

/**
 * Wraps an async operation with exponential backoff retry.
 *
 * @example
 * const data = await withRetry(
 *   () => supabase.from('orders').select('*'),
 *   { maxRetries: 3 },
 *   'OrdersAPI.getAll'
 * );
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName: string = "unknown"
): Promise<T> {
    const cfg = { ...DEFAULT_RETRY, ...config };
    let lastError: unknown;

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry if not retryable
            if (cfg.isRetryable && !cfg.isRetryable(error)) {
                throw error;
            }

            // Don't retry after max attempts
            if (attempt >= cfg.maxRetries) {
                break;
            }

            // Calculate delay: 2^attempt * base, with cap
            const exponentialDelay = Math.min(
                cfg.baseDelayMs * Math.pow(2, attempt),
                cfg.maxDelayMs
            );

            // Add jitter: randomize between 0.5x and 1.5x the delay
            const delay = cfg.jitter
                ? exponentialDelay * (0.5 + Math.random())
                : exponentialDelay;

            logger.warn(
                `[Retry] ${operationName}: attempt ${attempt + 1}/${cfg.maxRetries}, ` +
                `retrying in ${Math.round(delay)}ms`,
                { error: error instanceof Error ? error.message : String(error) }
            );

            await sleep(delay);
        }
    }

    // All retries exhausted
    logger.error(
        `[Retry] ${operationName}: all ${cfg.maxRetries} retries exhausted`,
        { lastError }
    );
    throw lastError;
}

// ============================================
// CIRCUIT BREAKER
// ============================================

/**
 * Circuit breaker implementation.
 * Tracks failures across calls and opens when threshold is reached.
 *
 * @example
 * const breaker = new CircuitBreaker('orders-api');
 * const data = await breaker.call(() => fetchOrders());
 */
export class CircuitBreaker {
    private state: CircuitState = "CLOSED";
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime = 0;
    private readonly config: CircuitBreakerConfig;
    private readonly name: string;

    constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CIRCUIT_BREAKER, ...config };
    }

    async call<T>(operation: () => Promise<T>, fallback?: () => T): Promise<T> {
        // Check if circuit is open
        if (this.state === "OPEN") {
            // Check if reset timeout has elapsed
            if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
                this.state = "HALF_OPEN";
                logger.info(`[CircuitBreaker] ${this.name}: transitioning to HALF_OPEN`);
            } else {
                logger.warn(`[CircuitBreaker] ${this.name}: circuit OPEN, using fallback`);
                if (fallback) return fallback();
                throw new Error(`Circuit breaker ${this.name} is OPEN`);
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            if (fallback && this.getState() === "OPEN") return fallback();
            throw error;
        }
    }

    private onSuccess(): void {
        if (this.state === "HALF_OPEN") {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.state = "CLOSED";
                this.failureCount = 0;
                this.successCount = 0;
                logger.info(`[CircuitBreaker] ${this.name}: circuit CLOSED (recovered)`);
            }
        } else {
            this.failureCount = 0;
        }
    }

    private onFailure(): void {
        this.failureCount++;
        this.successCount = 0;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.config.failureThreshold) {
            this.state = "OPEN";
            logger.error(
                `[CircuitBreaker] ${this.name}: circuit OPENED after ${this.failureCount} failures`
            );
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    reset(): void {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`[CircuitBreaker] ${this.name}: manually reset`);
    }
}

// ============================================
// TIMEOUT WRAPPER
// ============================================

/**
 * Wraps a promise with a timeout.
 * Rejects with a TimeoutError if the operation exceeds the deadline.
 *
 * @example
 * const data = await withTimeout(fetchOrders(), 5000, 'fetchOrders');
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string = "operation"
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`[Timeout] ${operationName} exceeded ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

// ============================================
// OFFLINE ACTION QUEUE
// ============================================

const QUEUE_STORAGE_KEY = "yalla_offline_queue";

/**
 * Queues mutations when offline and replays them when connectivity returns.
 *
 * @example
 * if (!navigator.onLine) {
 *   offlineQueue.enqueue('updateOrderStatus', { orderId, status });
 * }
 */
export const offlineQueue = {
    /** Add an action to the queue */
    enqueue(operation: string, payload: unknown): void {
        const queue = this.getQueue();
        const action: QueuedAction = {
            id: crypto.randomUUID(),
            operation,
            payload,
            timestamp: Date.now(),
            retryCount: 0,
        };
        queue.push(action);
        this.persist(queue);
        logger.info(`[OfflineQueue] Enqueued: ${operation}`, { id: action.id });
    },

    /** Get all queued actions */
    getQueue(): QueuedAction[] {
        try {
            const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    /** Persist queue to localStorage */
    persist(queue: QueuedAction[]): void {
        try {
            localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
        } catch {
            logger.warn("[OfflineQueue] Failed to persist queue to localStorage");
        }
    },

    /** Remove a processed action */
    dequeue(actionId: string): void {
        const queue = this.getQueue().filter((a) => a.id !== actionId);
        this.persist(queue);
    },

    /** Clear entire queue */
    clear(): void {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
    },

    /** Process queue with a handler map */
    async processQueue(
        handlers: Record<string, (payload: unknown) => Promise<boolean>>
    ): Promise<{ processed: number; failed: number }> {
        const queue = this.getQueue();
        if (queue.length === 0) return { processed: 0, failed: 0 };

        logger.info(`[OfflineQueue] Processing ${queue.length} queued actions`);

        let processed = 0;
        let failed = 0;

        for (const action of queue) {
            const handler = handlers[action.operation];
            if (!handler) {
                logger.warn(`[OfflineQueue] No handler for: ${action.operation}`);
                failed++;
                continue;
            }

            try {
                const success = await handler(action.payload);
                if (success) {
                    this.dequeue(action.id);
                    processed++;
                } else {
                    failed++;
                }
            } catch (error) {
                logger.error(`[OfflineQueue] Failed to process: ${action.operation}`, error);
                action.retryCount++;
                if (action.retryCount >= 5) {
                    this.dequeue(action.id); // Give up after 5 retries
                    failed++;
                }
            }
        }

        // Re-persist with updated retry counts for failed items
        this.persist(this.getQueue());

        return { processed, failed };
    },

    /** Number of pending actions */
    get pendingCount(): number {
        return this.getQueue().length;
    },
};

// ============================================
// RESILIENT SUPABASE CALL WRAPPER
// ============================================

/**
 * Combines retry + timeout + circuit breaker for a single Supabase call.
 * This is the primary utility for service-level operations.
 *
 * @example
 * const orders = await resilientCall(
 *   () => supabase.from('orders').select('*'),
 *   { operationName: 'getOrders', timeoutMs: 8000 }
 * );
 */
export async function resilientCall<T>(
    operation: () => Promise<T>,
    options: {
        operationName?: string;
        timeoutMs?: number;
        maxRetries?: number;
        fallback?: () => T;
        circuitBreaker?: CircuitBreaker;
    } = {}
): Promise<T> {
    const {
        operationName = "resilientCall",
        timeoutMs = 10000,
        maxRetries = 2,
        fallback,
        circuitBreaker,
    } = options;

    const timedOperation = () => withTimeout(operation(), timeoutMs, operationName);

    const retriedOperation = () =>
        withRetry(timedOperation, { maxRetries }, operationName);

    if (circuitBreaker) {
        return circuitBreaker.call(retriedOperation, fallback);
    }

    try {
        return await retriedOperation();
    } catch (error) {
        if (fallback) {
            logger.warn(`[Resilience] ${operationName}: using fallback after failure`);
            return fallback();
        }
        throw error;
    }
}

// ============================================
// ONLINE STATUS LISTENER
// ============================================

/**
 * Sets up online/offline listeners to auto-process the queue.
 * Call once at app startup.
 */
export function setupOnlineSync(
    handlers: Record<string, (payload: unknown) => Promise<boolean>>
): () => void {
    const handleOnline = () => {
        logger.info("[OnlineSync] Connection restored, processing offline queue");
        offlineQueue.processQueue(handlers);
    };

    window.addEventListener("online", handleOnline);

    // If already online and there are pending actions, process immediately
    if (navigator.onLine && offlineQueue.pendingCount > 0) {
        offlineQueue.processQueue(handlers);
    }

    return () => {
        window.removeEventListener("online", handleOnline);
    };
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
