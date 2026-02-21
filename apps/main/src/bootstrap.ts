import { setupRealtimeListeners } from './store/useStore';
import { getMessagingInstance } from './services/firebaseConfig';
import { initTelemetry } from './telemetry.safe';

/**
 * Safe Bootstrap Layer
 * Ensures no network-dependent or side-effect heavy logic executes at module load.
 */

let isBootstrapComplete = false;
let realtimeCleanup: (() => void) | null = null;

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

    console.log("[Bootstrap] Initializing safe runtime layer...");

    // 1. Safe Vendor/SDK Initialization
    initializeVendorSDKs();

    // 2. Initial Network Check & Layer Activation
    if (navigator.onLine) {
        activateNetworkLayer();
    }

    // 3. Persistent Connection Listeners
    window.addEventListener('online', () => {
        console.log("[Bootstrap] Connection restored. Activating network layer.");
        activateNetworkLayer();
    });

    window.addEventListener('offline', () => {
        console.log("[Bootstrap] Connection lost. Deactivating network layer.");
        deactivateNetworkLayer();
    });

    isBootstrapComplete = true;
};

function initializeVendorSDKs() {
    try {
        const globals = ['analytics', 'google', 'firebase', 'Emirates'];
        globals.forEach(g => {
            if (!(window as any)[g]) {
                (window as any)[g] = {};
            }
        });

        // Initialize Safe Telemetry Stub
        initTelemetry();
        console.log("[Bootstrap] Safe Telemetry initialized");

        // Initialize Firebase Messaging instance (lazy - only if online)
        if (navigator.onLine) {
            getMessagingInstance();
        }

    } catch (e) {
        console.warn("[Bootstrap] Vendor SDK guard initialization warning:", e);
    }
}

function activateNetworkLayer() {
    console.log("[Bootstrap] Realtime network layer activation suppressed for stability debugging");
    /*
    if (!realtimeCleanup) {
        realtimeCleanup = setupRealtimeListeners();
        console.log("[Bootstrap] Realtime listeners activated");
    }
    */
}

function deactivateNetworkLayer() {
    if (realtimeCleanup) {
        realtimeCleanup();
        realtimeCleanup = null;
        console.log("[Bootstrap] Realtime listeners deactivated");
    }
}
