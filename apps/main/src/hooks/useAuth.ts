import { useState, useEffect, useCallback } from "react";
import { startTransition } from "react";
import { User, UserTier } from "@/types";
import { supabase } from "@/services/supabaseClient";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchUserProfile = async (userId: string, email: string) => {
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single();
                if (mounted && data) {
                    setUser({
                        id: data.id,
                        name: data.full_name || "Valued Member",
                        email,
                        phone: data.phone || "",
                        address: data.address || "",
                        wallet_balance: data.wallet_balance || 0,
                        points: data.points || 0,
                        tier: (data.tier as UserTier) || UserTier.BRONZE,
                        isAdmin: data.is_admin || false,
                        joinDate: data.created_at,
                        status: "active",
                    });
                }
            } catch (e) {
                console.error("Error fetching profile", e);
            } finally {
                if (mounted) setAuthLoading(false);
            }
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                if (session) {
                    fetchUserProfile(session.user.id, session.user.email!);
                } else {
                    setAuthLoading(false);
                }
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                if (session) {
                    fetchUserProfile(session.user.id, session.user.email!);
                } else {
                    setUser(null);
                    setAuthLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        startTransition(() => {
            setUser(null);
        });
    }, []);

    return { user, setUser, authLoading, handleLogout };
}
