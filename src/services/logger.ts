import { ENV } from "@/config/env";

/**
 * Enhanced production-ready logger.
 * Drops all logs in production except critical errors.
 */
class Logger {
    info(message: string, ...args: any[]) {
        if (ENV.isDev) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]) {
        if (ENV.isDev) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]) {
        // We keep errors even in prod, but maybe send them to a service like Sentry in the future
        console.error(`[ERROR] ${message}`, ...args);
    }

    debug(message: string, ...args: any[]) {
        if (ENV.isDev) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
}

export const logger = new Logger();
