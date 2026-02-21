import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkUserRole = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || data?.role !== 'driver') {
            await supabase.auth.signOut();
            setUser(null);
            setError("Unauthorized. Driver access only.");
            return false;
        }
        return true;
    };

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const isDriver = await checkUserRole(session.user.id);
                if (isDriver) setUser(session.user);
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (session?.user) {
                    const isDriver = await checkUserRole(session.user.id);
                    if (isDriver) setUser(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
    };

    return { user, loading, error, signOut };
}
