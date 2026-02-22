export function initTelemetry() {
    if (typeof window === 'undefined') return
    if (!navigator.onLine) return

    try {
        console.info("Telemetry disabled in production stabilization mode.")
    } catch (e) {
        console.warn("Telemetry init skipped:", e)
    }
}
