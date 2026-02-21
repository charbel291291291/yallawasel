import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useDriverStore } from '../../store/useDriverStore';
import { Profile } from '../../types';

export function useAuth() {
    const { setProfile, setSessionLoading, profile } = useDriverStore();
    const isFetching = useRef<string | null>(null);

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        // Prevent duplicate simultaneous fetches for the same user
        if (isFetching.current === userId) return null;
        isFetching.current = userId;

        try {
            console.log("[Auth] Fetching profile for:", userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("[Auth] Profile Fetch Error:", error.message);
                return null;
            }

            console.log("[Auth] Raw Profile Data from DB:", data);

            if (data?.role !== 'driver') {
                console.warn("[Auth] ACCESS DENIED: User role is '" + data?.role + "', but 'driver' is required.");
                await supabase.auth.signOut();
                return null;
            }

            console.log("[Auth] Profile verified as DRIVER. Status:", data.status, "Verified:", data.verified);
            return data;
        } finally {
            isFetching.current = null;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncAuth = async (session: any) => {
            if (!session?.user) {
                if (isMounted) {
                    setProfile(null);
                    setSessionLoading(false);
                }
                return;
            }

            try {
                const prof = await fetchProfile(session.user.id);
                if (isMounted) setProfile(prof);
            } catch (err) {
                console.error("[Auth] Sync failed:", err);
            } finally {
                if (isMounted) setSessionLoading(false);
            }
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) syncAuth(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[Auth] State Event:", event);
            if (isMounted) syncAuth(session);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile, setProfile, setSessionLoading]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return { profile, signOut };
}
