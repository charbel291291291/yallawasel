/**
 * RUNTIME VALIDATION ENGINE
 * =========================
 * Central validation utility for all Supabase API responses.
 * - Parses data through Zod schemas at the API boundary
 * - Logs structured errors for monitoring
 * - Returns safe fallback values to prevent UI crashes
 * - Tree-shakeable: only imported schemas are bundled
 */

import { ZodError, type ZodSchema } from "zod";
import { logger } from "@/services/logger";

// ============================================
// ERROR TYPES
// ============================================

export type ValidationErrorCategory =
    | "VALIDATION"
    | "NETWORK"
    | "AUTH"
    | "UNKNOWN";

export interface StructuredValidationError {
    category: ValidationErrorCategory;
    source: string;
    message: string;
    details: Array<{
        path: string;
        expected: string;
        received: string;
    }>;
    timestamp: string;
    rawData?: unknown;
}

// ============================================
// VALIDATION CORE
// ============================================

/**
 * Validates API response data against a Zod schema.
 * Returns validated data on success, or a fallback on failure.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The raw data from Supabase
 * @param source - Identifier for the call site (for error logging)
 * @param fallback - Safe fallback value returned if validation fails
 */
export function validateResponse<T>(
    schema: ZodSchema<T>,
    data: unknown,
    source: string,
    fallback: T
): T {
    // Null/undefined data — return fallback silently
    if (data === null || data === undefined) {
        return fallback;
    }

    const result = schema.safeParse(data);

    if (result.success) {
        return result.data;
    }

    // Build structured error
    const structuredError = buildValidationError(result.error, source, data);
    logValidationError(structuredError);

    return fallback;
}

/**
 * Validates an array of items. Invalid items are filtered out
 * rather than rejecting the entire array.
 *
 * @param schema - Schema for a single item
 * @param data - Raw array from Supabase
 * @param source - Identifier for call site
 */
export function validateArray<T>(
    schema: ZodSchema<T>,
    data: unknown,
    source: string
): T[] {
    if (!Array.isArray(data)) {
        logValidationError({
            category: "VALIDATION",
            source,
            message: "Expected array, received " + typeof data,
            details: [],
            timestamp: new Date().toISOString(),
            rawData: data,
        });
        return [];
    }

    const validated: T[] = [];
    const errors: Array<{ index: number; error: ZodError }> = [];

    for (let i = 0; i < data.length; i++) {
        const result = schema.safeParse(data[i]);
        if (result.success) {
            validated.push(result.data);
        } else {
            errors.push({ index: i, error: result.error });
        }
    }

    // Log batch errors (if any) as a single entry
    if (errors.length > 0) {
        logValidationError({
            category: "VALIDATION",
            source,
            message: `${errors.length}/${data.length} items failed validation`,
            details: errors.slice(0, 3).flatMap((e) =>
                e.error.issues.map((issue) => ({
                    path: `[${e.index}].${issue.path.join(".")}`,
                    expected: issue.message,
                    received: String(
                        (data[e.index] as Record<string, unknown>)?.[
                        String(issue.path[0])
                        ] ?? "undefined"
                    ),
                }))
            ),
            timestamp: new Date().toISOString(),
        });
    }

    return validated;
}

/**
 * Validates a single nullable response (e.g., .single() queries).
 * Returns null if validation fails.
 */
export function validateSingle<T>(
    schema: ZodSchema<T>,
    data: unknown,
    source: string
): T | null {
    if (data === null || data === undefined) {
        return null;
    }

    const result = schema.safeParse(data);

    if (result.success) {
        return result.data;
    }

    const structuredError = buildValidationError(result.error, source, data);
    logValidationError(structuredError);

    return null;
}

// ============================================
// ERROR CLASSIFICATION
// ============================================

/**
 * Classifies an error into a category for the ErrorBoundary
 */
export function classifyError(error: unknown): ValidationErrorCategory {
    if (error instanceof ZodError) return "VALIDATION";

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
            return "NETWORK";
        }
        if (msg.includes("auth") || msg.includes("jwt") || msg.includes("unauthorized") || msg.includes("403")) {
            return "AUTH";
        }
    }

    return "UNKNOWN";
}

/**
 * Type guard to check if an error is a Zod validation error
 */
export function isValidationError(error: unknown): error is ZodError {
    return error instanceof ZodError;
}

// ============================================
// INTERNAL HELPERS
// ============================================

function buildValidationError(
    error: ZodError,
    source: string,
    rawData?: unknown
): StructuredValidationError {
    return {
        category: "VALIDATION",
        source,
        message: `Validation failed: ${error.issues.length} issue(s)`,
        details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            expected: issue.message,
            received: getValueAtPath(rawData, issue.path as (string | number)[]),
        })),
        timestamp: new Date().toISOString(),
        rawData,
    };
}

function logValidationError(error: StructuredValidationError): void {
    logger.warn(
        `[${error.category}] ${error.source}: ${error.message}`,
        error.details.length > 0
            ? error.details.slice(0, 5) // Cap logged details
            : undefined
    );
}

function getValueAtPath(data: unknown, path: Array<string | number>): string {
    let current: unknown = data;
    for (const key of path) {
        if (current === null || current === undefined || typeof current !== "object") {
            return "undefined";
        }
        current = (current as Record<string, unknown>)[String(key)];
    }
    return current === undefined ? "undefined" : JSON.stringify(current);
}

