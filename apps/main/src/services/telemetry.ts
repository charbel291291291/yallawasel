import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * Enterprise Performance Monitoring System
 * Tracks Core Web Vitals and Interaction to Next Paint (INP)
 */
class TelemetryService {
    private static instance: TelemetryService;
    private isProduction = import.meta.env.PROD;

    private constructor() {
        this.init();
    }

    public static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    private init() {
        if (typeof window === 'undefined') return;

        // Track Core Web Vitals
        onCLS(this.reportMetric);
        onFCP(this.reportMetric);
        onFID(this.reportMetric);
        onLCP(this.reportMetric);
        onTTFB(this.reportMetric);

        // TRACK INP - Critical for UI Responsiveness
        onINP(this.reportMetric);
    }

    private reportMetric = (metric: Metric) => {
        // Log to console in development
        if (!this.isProduction) {
            const isHighINP = metric.name === 'INP' && metric.value > 150;
            const logFn = isHighINP ? console.error : console.log;

            logFn(`[Performance] ${isHighINP ? 'CRITICAL ' : ''}${metric.name}:`, {
                value: metric.value,
                id: metric.id,
                rating: metric.rating,
                navigationType: metric.navigationType,
            });
            return;
        }

        // In production, send to analytics endpoint
        // We use sendBeacon for non-blocking telemetry
        const body = JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            id: metric.id,
            url: window.location.href,
            app: 'yalla-main',
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/telemetry', body);
        } else {
            fetch('/api/telemetry', {
                body,
                method: 'POST',
                keepalive: true,
                mode: 'no-cors'
            }).catch(() => { /* silent fail */ });
        }
    };

    /**
     * Log custom interaction timing
     */
    public logInteraction(name: string, duration: number) {
        if (!this.isProduction) {
            console.log(`[Interaction] ${name} took ${duration.toFixed(2)}ms`);
        }
        // Logic to send custom metrics could go here
    }
}

export const telemetry = TelemetryService.getInstance();
