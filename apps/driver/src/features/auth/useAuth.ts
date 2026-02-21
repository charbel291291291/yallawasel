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
        let safetyTimeout: any = null;

        const syncAuth = async (session: any) => {
            console.log("[Auth] Syncing session state for user:", session?.user?.id || 'none');

            // Safety timeout to ensure loading screen always clears within 10s
            safetyTimeout = setTimeout(() => {
                if (isMounted) {
                    console.warn("[Auth] Initialization safety timeout reached. Forcing loading screen clear.");
                    setSessionLoading(false);
                }
            }, 10000);

            if (!session?.user) {
                console.log("[Auth] No active session found.");
                if (isMounted) {
                    setProfile(null);
                    setSessionLoading(false);
                    clearTimeout(safetyTimeout);
                }
                return;
            }

            try {
                const prof = await fetchProfile(session.user.id);
                if (isMounted) {
                    setProfile(prof);
                    console.log("[Auth] Driver profile synchronized successfully.");
                }
            } catch (err) {
                console.error("[Auth] Sync failed drastically:", err);
            } finally {
                if (isMounted) {
                    setSessionLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        };

        // Initial check: getSession is often faster/more reliable for the first paint
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) syncAuth(session);
        }).catch(err => {
            console.error("[Auth] getSession failed:", err);
            if (isMounted) setSessionLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[Auth] External event detected:", event);
            if (isMounted) syncAuth(session);
        });

        return () => {
            isMounted = false;
            if (safetyTimeout) clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, [fetchProfile, setProfile, setSessionLoading]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return { profile, signOut };
}
