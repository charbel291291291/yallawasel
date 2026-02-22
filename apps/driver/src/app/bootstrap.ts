import { initTelemetry } from '@/utils/telemetrySafe';

/**
 * Driver App Bootstrap Layer
 */

let isBootstrapComplete = false;

export const bootstrap = async () => {
    if (isBootstrapComplete || typeof window === 'undefined') return;

    // 0. Defensive Global Guard
    if (!(window as any).Activity) {
        Object.defineProperty(window, "Activity", {
            value: {},
            writable: true,
            configurable: true,
        });
    }

    console.log("[Bootstrap-Driver] Initializing safe runtime layer...");

    // 1. Safe Vendor Guards
    try {
        const globals = ['analytics', 'google', 'Activity'];
        globals.forEach(g => {
            if (!(window as any)[g]) {
                (window as any)[g] = {};
            }
        });

        // Initialize Safe Telemetry Stub
        initTelemetry();
    } catch (e) {
        console.warn("[Bootstrap-Driver] Initial vendor guard warning:", e);
    }

    // 2. Connection Resilience
    window.addEventListener('online', () => {
        console.log("[Bootstrap-Driver] Device back online");
    });

    window.addEventListener('offline', () => {
        console.log("[Bootstrap-Driver] Device offline");
    });

    isBootstrapComplete = true;
};
