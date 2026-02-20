// 🔐 STEP 3 — SAFE SUPABASE CLIENT INITIALIZATION
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRITICAL: Missing Supabase environment variables in Driver PWA.");
    // In production, we might want to show a UI error. In Dev, we throw.
    if (import.meta.env.DEV) {
        throw new Error("Supabase environment variables (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) are required.");
    }
}

export const ENV = {
    supabaseUrl: supabaseUrl || "",
    supabaseAnonKey: supabaseAnonKey || "",
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
};
