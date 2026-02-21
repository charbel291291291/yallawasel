/**
 * PERFORMANCE ARCHITECTURE SERVICE
 * Enforces interaction budgets and monitors main-thread health.
 */

export const performanceService = {
    /**
     * SAFE INTERACTION WRAPPER
     * Measures interaction-to-paint lag and logs duration.
     */
    safeInteraction: (fn: (...args: any[]) => void) => {
        return (...args: any[]) => {
            const label = `interaction-${Date.now()}`;
            performance.mark(`${label}-start`);

            fn(...args);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    performance.mark(`${label}-end`);
                    try {
                        performance.measure(
                            'INP_ESTIMATE',
                            `${label}-start`,
                            `${label}-end`
                        );
                        const measure = performance.getEntriesByName('INP_ESTIMATE').pop();
                        if (measure && measure.duration > 150) {
                            console.warn(`[PERF] Slow Interaction detected: ${measure.duration.toFixed(2)}ms`);
                        }
                    } catch (e) {
                        // Performance marks might fail in some contexts
                    }
                });
            });
        };
    },

    /**
     * LONG TASK OBSERVER
     * Detects blocking main-thread tasks > 50ms in production.
     */
    initLongTaskObserver: (threshold = 50) => {
        if (!('PerformanceObserver' in window)) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > threshold) {
                    console.error(`[PERF] Long Task Detected: ${entry.duration.toFixed(2)}ms`, entry);
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.warn('Long task observation not supported');
        }
    }
};
