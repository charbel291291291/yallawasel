import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const FleetLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAdmin } = useAuth();

    // Role Guard
    const isFleetManager = user?.role === 'fleet_manager' || isAdmin;

    if (!user || !isFleetManager) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-[#0A0C14] text-slate-200 font-sans selection:bg-primary/30">
            {/* Top Header */}
            <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <i className="fas fa-satellite text-primary"></i>
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Fleet Terminal</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Logistics Surveillance</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Network Stable</span>
                    </div>

                    <div className="w-[1px] h-8 bg-white/5"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white uppercase">{user.full_name}</p>
                            <p className="text-[9px] text-primary font-bold uppercase tracking-widest">{user.role?.replace('_', ' ')}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <i className="fas fa-user-shield text-xs text-slate-400"></i>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-[1600px] mx-auto space-y-8">
                {children}
            </main>
        </div>
    );
};
