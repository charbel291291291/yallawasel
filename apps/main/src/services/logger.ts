import { ENV } from "@/config/env";

/**
 * Enhanced production-ready logger.
 * Drops all logs in production except critical errors.
 * Uses unknown[] instead of any[] for strict type safety.
 */
class Logger {
    info(message: string, ...args: unknown[]) {
        if (ENV.isDev) {
            // eslint-disable-next-line no-console
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: unknown[]) {
        if (ENV.isDev) {
            // eslint-disable-next-line no-console
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: unknown[]) {
        // We keep errors even in prod for monitoring/Sentry integration
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${message}`, ...args);
    }

    debug(message: string, ...args: unknown[]) {
        if (ENV.isDev) {
            // eslint-disable-next-line no-console
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
}

export const logger = new Logger();
