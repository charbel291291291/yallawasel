import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '../layouts/ShellLayout';
import { useAuth } from '../hooks/useAuth';

const DriverLoginPage: React.FC = () => {
    const { error: authError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const navigate = useNavigate();

    const error = localError || authError;


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            navigate('/terminal');
        } catch (err: any) {
            setLocalError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ShellLayout>
            <div className="w-full max-w-[420px] bg-[#151515] border border-white/5 rounded-2xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-3d-entrance">
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full"></div>
                        <img src="/icons/icon-192x192.png" alt="YW" className="w-20 h-20 rounded-2xl mx-auto relative z-10 border border-white/10" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-2">Driver Terminal</h1>
                    <p className="text-red-500/60 font-bold uppercase tracking-[0.2em] text-[10px]">Authorized Access Only</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-pulse">
                        <i className="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
                        <p className="text-red-200 text-xs font-bold leading-tight uppercase tracking-wide">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Terminal ID (Email)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/5 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-bold placeholder:text-white/10"
                            placeholder="operator@yallawasel.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Access Key (Password)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#111] border border-white/5 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-bold placeholder:text-white/10"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl active:scale-[0.97] transition-all duration-300 disabled:opacity-50 mt-6 uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        <span>{loading ? 'Initializing...' : 'Connect to Terminal'}</span>
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.25em]">
                        Operational Control v1.0 • Secure Link Active
                    </p>
                </div>
            </div>
        </ShellLayout>
    );
};

export default DriverLoginPage;
