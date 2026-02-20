/**
 * OBSERVABILITY & INTELLIGENCE LAYER
 * ====================================
 * Production-grade monitoring, telemetry, and alerting.
 *
 * Components:
 * - Performance tracking (API latency)
 * - Error rate monitoring
 * - Business KPI tracking
 * - Alert thresholds with notifications
 * - Structured telemetry events
 *
 * Design:
 * - Decoupled from any specific monitoring vendor (Sentry, Datadog, etc.)
 * - Ships events to a local buffer that can be flushed to any backend
 * - Client-side only — no server dependency
 * - Integrates with existing logger
 */

import { logger } from "@/services/logger";

// ============================================
// TYPES
// ============================================

export interface TelemetryEvent {
    name: string;
    category: "api" | "business" | "error" | "performance" | "user";
    timestamp: number;
    duration?: number;
    metadata?: Record<string, unknown>;
    severity: "info" | "warn" | "error" | "critical";
}

export interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    metadata?: Record<string, unknown>;
}

export interface AlertThreshold {
    metric: string;
    condition: "gt" | "lt" | "eq";
    value: number;
    windowMs: number;
    severity: "warn" | "error" | "critical";
    message: string;
}

interface MetricWindow {
    values: number[];
    timestamps: number[];
}

// ============================================
// PERFORMANCE TRACKER
// ============================================

class PerformanceTracker {
    private metrics: PerformanceMetric[] = [];
    private readonly maxMetrics = 500;

    /**
     * Track an async operation's performance.
     * Returns the result of the operation.
     */
    async track<T>(
        operation: string,
        fn: () => Promise<T>,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        const startTime = performance.now();
        let success = true;

        try {
            return await fn();
        } catch (error) {
            success = false;
            throw error;
        } finally {
            const endTime = performance.now();
            const duration = endTime - startTime;

            const metric: PerformanceMetric = {
                operation,
                startTime,
                endTime,
                duration,
                success,
                metadata,
            };

            this.record(metric);

            // Alert on slow operations
            if (duration > 1000) {
                telemetry.alert({
                    metric: "api_latency",
                    value: duration,
                    operation,
                    severity: duration > 3000 ? "error" : "warn",
                });
            }
        }
    }

    private record(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        // Prevent unbounded growth
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }

    /** Get average latency for an operation over the last N minutes */
    getAverageLatency(operation: string, windowMinutes: number = 5): number {
        const cutoff = performance.now() - windowMinutes * 60 * 1000;
        const relevant = this.metrics.filter(
            (m) => m.operation === operation && m.startTime >= cutoff
        );

        if (relevant.length === 0) return 0;
        return relevant.reduce((sum, m) => sum + m.duration, 0) / relevant.length;
    }

    /** Get error rate for an operation over the last N minutes */
    getErrorRate(operation: string, windowMinutes: number = 5): number {
        const cutoff = performance.now() - windowMinutes * 60 * 1000;
        const relevant = this.metrics.filter(
            (m) => m.operation === operation && m.startTime >= cutoff
        );

        if (relevant.length === 0) return 0;
        const failures = relevant.filter((m) => !m.success).length;
        return (failures / relevant.length) * 100;
    }

    /** Get P50, P95, P99 latency percentiles */
    getPercentiles(
        operation: string,
        windowMinutes: number = 15
    ): { p50: number; p95: number; p99: number } {
        const cutoff = performance.now() - windowMinutes * 60 * 1000;
        const durations = this.metrics
            .filter((m) => m.operation === operation && m.startTime >= cutoff)
            .map((m) => m.duration)
            .sort((a, b) => a - b);

        if (durations.length === 0) return { p50: 0, p95: 0, p99: 0 };

        return {
            p50: percentile(durations, 50),
            p95: percentile(durations, 95),
            p99: percentile(durations, 99),
        };
    }

    /** Dump all metrics (for debugging) */
    getMetrics(): ReadonlyArray<PerformanceMetric> {
        return this.metrics;
    }
}

// ============================================
// BUSINESS KPI TRACKER
// ============================================

class BusinessKPITracker {
    private windows: Map<string, MetricWindow> = new Map();
    private readonly maxWindowSize = 1000;

    /** Record a business event value */
    record(metric: string, value: number = 1): void {
        const window = this.getOrCreateWindow(metric);
        window.values.push(value);
        window.timestamps.push(Date.now());

        // Trim old entries
        if (window.values.length > this.maxWindowSize) {
            window.values = window.values.slice(-this.maxWindowSize);
            window.timestamps = window.timestamps.slice(-this.maxWindowSize);
        }
    }

    /** Get rate per hour for a metric */
    getRatePerHour(metric: string): number {
        const window = this.windows.get(metric);
        if (!window || window.values.length === 0) return 0;

        const hourAgo = Date.now() - 60 * 60 * 1000;
        const recentCount = window.timestamps.filter((t) => t >= hourAgo).length;
        return recentCount;
    }

    /** Get sum over a time window */
    getSum(metric: string, windowMs: number = 60 * 60 * 1000): number {
        const window = this.windows.get(metric);
        if (!window) return 0;

        const cutoff = Date.now() - windowMs;
        let sum = 0;
        for (let i = 0; i < window.timestamps.length; i++) {
            if (window.timestamps[i] >= cutoff) {
                sum += window.values[i];
            }
        }
        return sum;
    }

    /** Get count of events in a time window */
    getCount(metric: string, windowMs: number = 60 * 60 * 1000): number {
        const window = this.windows.get(metric);
        if (!window) return 0;

        const cutoff = Date.now() - windowMs;
        return window.timestamps.filter((t) => t >= cutoff).length;
    }

    private getOrCreateWindow(metric: string): MetricWindow {
        if (!this.windows.has(metric)) {
            this.windows.set(metric, { values: [], timestamps: [] });
        }
        return this.windows.get(metric)!;
    }
}

// ============================================
// TELEMETRY HUB
// ============================================

class TelemetryHub {
    private events: TelemetryEvent[] = [];
    private readonly maxEvents = 1000;
    private readonly alertThresholds: AlertThreshold[] = [];
    private alertCallbacks: Array<(alert: Record<string, unknown>) => void> = [];

    readonly perf = new PerformanceTracker();
    readonly kpi = new BusinessKPITracker();

    constructor() {
        this.setupDefaultAlerts();
    }

    /** Emit a telemetry event */
    emit(event: Omit<TelemetryEvent, "timestamp">): void {
        const fullEvent: TelemetryEvent = {
            ...event,
            timestamp: Date.now(),
        };

        this.events.push(fullEvent);

        // Prevent unbounded growth
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Log critical/error events
        if (event.severity === "critical") {
            logger.error(`[Telemetry] CRITICAL: ${event.name}`, event.metadata);
        } else if (event.severity === "error") {
            logger.error(`[Telemetry] ${event.name}`, event.metadata);
        }
    }

    /** Track an API call */
    async trackAPI<T>(
        operationName: string,
        operation: () => Promise<T>,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        this.kpi.record("api_calls_total");

        try {
            const result = await this.perf.track(operationName, operation, metadata);
            this.kpi.record("api_calls_success");
            return result;
        } catch (error) {
            this.kpi.record("api_calls_failed");
            this.kpi.record("error_count");

            this.emit({
                name: "api_error",
                category: "error",
                severity: "error",
                metadata: {
                    operation: operationName,
                    error: error instanceof Error ? error.message : String(error),
                    ...metadata,
                },
            });

            throw error;
        }
    }

    /** Register an alert callback */
    onAlert(callback: (alert: Record<string, unknown>) => void): void {
        this.alertCallbacks.push(callback);
    }

    /** Fire an alert */
    alert(alertData: Record<string, unknown>): void {
        logger.warn(`[Alert] ${alertData.metric}`, alertData);

        for (const cb of this.alertCallbacks) {
            try {
                cb(alertData);
            } catch {
                // Don't let alert handlers crash the app
            }
        }
    }

    /** Check thresholds against current metrics */
    checkThresholds(): void {
        for (const threshold of this.alertThresholds) {
            const currentValue = this.getMetricValue(threshold.metric, threshold.windowMs);
            const triggered =
                (threshold.condition === "gt" && currentValue > threshold.value) ||
                (threshold.condition === "lt" && currentValue < threshold.value) ||
                (threshold.condition === "eq" && currentValue === threshold.value);

            if (triggered) {
                this.alert({
                    metric: threshold.metric,
                    value: currentValue,
                    threshold: threshold.value,
                    condition: threshold.condition,
                    severity: threshold.severity,
                    message: threshold.message,
                });
            }
        }
    }

    /** Get a snapshot of system health */
    getHealthSnapshot(): Record<string, unknown> {
        return {
            timestamp: new Date().toISOString(),
            apiCalls: {
                total: this.kpi.getRatePerHour("api_calls_total"),
                success: this.kpi.getRatePerHour("api_calls_success"),
                failed: this.kpi.getRatePerHour("api_calls_failed"),
                errorRate: this.calculateErrorRate(),
            },
            business: {
                ordersPerHour: this.kpi.getRatePerHour("order_placed"),
                ordersDelivered: this.kpi.getRatePerHour("order_delivered"),
                failedTransactions: this.kpi.getRatePerHour("transaction_failed"),
                pointsAnomalies: this.kpi.getRatePerHour("points_anomaly"),
            },
            recentEvents: this.events.slice(-10),
        };
    }

    private getMetricValue(metric: string, windowMs: number): number {
        switch (metric) {
            case "error_rate":
                return this.calculateErrorRate();
            case "error_count":
                return this.kpi.getCount("error_count", windowMs);
            default:
                return this.kpi.getCount(metric, windowMs);
        }
    }

    private calculateErrorRate(): number {
        const total = this.kpi.getRatePerHour("api_calls_total");
        const failed = this.kpi.getRatePerHour("api_calls_failed");
        if (total === 0) return 0;
        return (failed / total) * 100;
    }

    private setupDefaultAlerts(): void {
        // Error rate > 3%
        this.alertThresholds.push({
            metric: "error_rate",
            condition: "gt",
            value: 3,
            windowMs: 5 * 60 * 1000,
            severity: "critical",
            message: "Error rate exceeds 3% in the last 5 minutes",
        });

        // More than 10 errors in 5 minutes
        this.alertThresholds.push({
            metric: "error_count",
            condition: "gt",
            value: 10,
            windowMs: 5 * 60 * 1000,
            severity: "error",
            message: "High error volume: >10 errors in 5 minutes",
        });

        // Start periodic threshold checks
        if (typeof window !== "undefined") {
            setInterval(() => this.checkThresholds(), 60 * 1000); // Every minute
        }
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const telemetry = new TelemetryHub();

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Track a business KPI event
 * @example trackKPI('order_placed', 1);
 */
export function trackKPI(event: string, value: number = 1): void {
    telemetry.kpi.record(event, value);
}

/**
 * Track an API operation with full telemetry
 * @example
 * const orders = await trackedAPI('getOrders', () => supabase.from('orders').select('*'));
 */
export function trackedAPI<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<T> {
    return telemetry.trackAPI(name, operation, metadata);
}

// ============================================
// HELPERS
// ============================================

function percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}
