import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (url: string, key: string) => {
    if (!url || !key) {
        throw new Error('Supabase URL and Anon Key are required');
    }

    return createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        }
    });
};
