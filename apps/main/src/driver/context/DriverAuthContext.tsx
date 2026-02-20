import { useState, useEffect, useCallback, createContext, ReactNode } from "react";
import { supabase } from "@/services/supabaseClient";
import { DriverSession, DriverProfile } from "../types";

interface DriverAuthContextType {
    session: DriverSession | null;
    loading: boolean;
    logout: () => Promise<void>;
    updateStatus: (status: "online" | "busy" | "offline") => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextType>({
    session: null,
    loading: true,
    logout: async () => { },
    updateStatus: async () => { },
});

export const DriverAuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<DriverSession | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDriverProfile = useCallback(async (userId: string): Promise<DriverProfile | null> => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Profile fetch error:", error.message);
                return null;
            }
            return data as DriverProfile;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const checkUser = async () => {
            try {
                const { data: { session: existingSession }, error } = await supabase.auth.getSession();

                if (error || !existingSession || cancelled) {
                    if (!cancelled) setLoading(false);
                    return;
                }

                const profile = await fetchDriverProfile(existingSession.user.id);

                if (cancelled) return;

                if (profile?.role === "driver" || profile?.role === "admin") {
                    setSession({ user: existingSession.user, role: profile.role, profile });
                } else {
                    await supabase.auth.signOut();
                    setSession(null);
                }
            } catch {
                if (!cancelled) setSession(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
            if (cancelled) return;

            if (authSession) {
                const profile = await fetchDriverProfile(authSession.user.id);
                if (cancelled) return;

                if (profile?.role === "driver" || profile?.role === "admin") {
                    setSession({ user: authSession.user, role: profile.role, profile });
                } else {
                    setSession(null);
                }
            } else {
                setSession(null);
            }
            setLoading(false);
        });

        return () => {
            cancelled = true;
            authListener.subscription.unsubscribe();
        };
    }, [fetchDriverProfile]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
    }, []);

    const updateStatus = useCallback(async (status: "online" | "busy" | "offline") => {
        if (!session?.user?.id) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                driver_status: status,
                is_online: status === "online",
            })
            .eq("id", session.user.id);

        if (!error && session.profile) {
            setSession(prev => prev ? {
                ...prev,
                profile: { ...prev.profile!, driver_status: status, is_online: status === "online" },
            } : null);
        }
    }, [session?.user?.id, session?.profile]);

    return (
        <DriverAuthContext.Provider value={{ session, loading, logout, updateStatus }}>
            {children}
        </DriverAuthContext.Provider>
    );
};

export default DriverAuthContext;
