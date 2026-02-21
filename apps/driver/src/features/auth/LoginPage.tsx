import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ShellLayout } from '../../layouts/ShellLayout';

export const LoginPage: React.FC = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("[Login] Starting sign-in for:", credentials.email);
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (authError) throw authError;
            console.log("[Login] Success! Waiting for profile sync...");

            // We set loading false here so the button resets if the redirect is slow
            setLoading(false);
        } catch (err: any) {
            console.error("[Login] Sign-in failed:", err.message);
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
        // Note: we don't setLoading(false) in finally if successful, 
        // to keep the "Validating" state until the app redirects.
    };

    return (
        <ShellLayout>
            <div className="w-full max-w-[400px] bg-[#1a1a1a] border border-white/5 rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-3d-entrance">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Terminal Access</h1>
                    <p className="text-red-500/50 font-black uppercase tracking-[0.2em] text-[10px]">Security Clearance Required</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-[11px] font-bold uppercase tracking-wide leading-tight">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">Terminal ID</label>
                        <input
                            type="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-red-500/30 transition-all font-bold"
                            placeholder="operator@yallawasel.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">Security Key</label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-red-500/30 transition-all font-bold"
                            placeholder="••••••••"
                        />
                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-red-600/20"
                    >
                        {loading ? 'Validating...' : 'Connect to Feed'}
                    </button>
                </form>
            </div>
        </ShellLayout>
    );
};
