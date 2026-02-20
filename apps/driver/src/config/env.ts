/**
 * Driver App Environment Config
 */
export const ENV = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
};

if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    console.error("CRITICAL: Missing Supabase environment variables in Driver PWA.");
}
