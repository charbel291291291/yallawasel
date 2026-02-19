import React, { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";
import { User, UserTier } from "@/types";
import { supabase } from "@/services/supabaseClient";

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    authLoading: boolean;
    handleLogout: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const fetchUserProfile = useCallback(async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) throw error;

            if (data) {
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
            console.error("[AuthContext] Error fetching profile:", e);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                if (session && session.user) {
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
                if (session && session.user) {
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
    }, [fetchUserProfile]);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        startTransition(() => {
            setUser(null);
        });
    }, []);

    const value = {
        user,
        setUser,
        authLoading,
        handleLogout,
        isAdmin: user?.isAdmin || false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
