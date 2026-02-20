import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * Enterprise Performance Monitoring System - Driver App
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

        onCLS(this.reportMetric);
        onFCP(this.reportMetric);
        onFID(this.reportMetric);
        onLCP(this.reportMetric);
        onTTFB(this.reportMetric);
        onINP(this.reportMetric);
    }

    private reportMetric = (metric: Metric) => {
        if (!this.isProduction) {
            console.log(`[Performance-Driver] ${metric.name}:`, {
                value: metric.value,
                rating: metric.rating,
            });
            return;
        }

        const body = JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            id: metric.id,
            url: window.location.href,
            app: 'yalla-driver',
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/telemetry', body);
        }
    };

    public logInteraction(name: string, duration: number) {
        if (!this.isProduction) {
            console.log(`[Interaction-Driver] ${name} took ${duration.toFixed(2)}ms`);
        }
    }
}

export const telemetry = TelemetryService.getInstance();
