/**
 * Environment variable validation and access utility.
 * Ensures the application fails fast if required secrets are missing.
 */

interface EnvConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
    adminPin: string;
    isProd: boolean;
    isDev: boolean;
    apiKey: string;
}

const getEnv = (key: string, required = true): string => {
    const value = import.meta.env[key];
    if (required && !value) {
        throw new Error(`CRITICAL: Environment variable ${key} is missing.`);
    }
    return value || "";
};

export const ENV: EnvConfig = {
    supabaseUrl: getEnv("VITE_SUPABASE_URL"),
    supabaseAnonKey: getEnv("VITE_SUPABASE_ANON_KEY"),
    adminPin: getEnv("VITE_ADMIN_PIN", false) || "000000",
    apiKey: getEnv("VITE_API_KEY", false) || getEnv("GEMINI_API_KEY", false),
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
};

/**
 * Validates critical environment variables at runtime.
 */
export const validateEnv = (): void => {
    const required = [
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        // "VITE_ADMIN_PIN", // Optional in Dev, defaults to 000000
    ];

    const missing = required.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
        throw new Error(`Production Block: Missing env variables: ${missing.join(", ")}`);
    }
};
