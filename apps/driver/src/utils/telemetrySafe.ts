import { onINP, onLCP, onCLS, Metric } from 'web-vitals';

/**
 * PRODUCTION TELEMETRY & PERFORMANCE GUARD
 * Reports core web vitals to ensure architectual compliance (INP < 150ms).
 */
export function initTelemetry() {
    if (typeof window === 'undefined') return;

    // 1. Monitor INP (Interaction to Next Paint)
    onINP((metric) => {
        if (metric.value > 150) {
            // Type safety for INP metric which has entries
            console.error(`[PERF_GUARD] High INP Detected: ${metric.value}ms`, metric);
        } else {
            console.debug(`[PERF] INP: ${metric.value}ms`);
        }
    });

    // 2. Monitor LCP (Largest Contentful Paint)
    onLCP((metric: Metric) => {
        console.debug(`[PERF] LCP: ${metric.value}ms`);
    });

    // 3. Monitor CLS (Cumulative Layout Shift)
    onCLS((metric: Metric) => {
        if (metric.value > 0.1) {
            console.warn(`[PERF_GUARD] Layout Shift Detected: ${metric.value}`);
        }
    });

    console.info("Performance Architecture Guard Active.");
}
