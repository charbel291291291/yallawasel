import { createSupabaseClient } from '@yallawasel/shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SupabaseClient] Critical configuration missing. Check environment variables.');
}

export const supabase = createSupabaseClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);


