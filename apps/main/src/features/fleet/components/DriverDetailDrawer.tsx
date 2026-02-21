import React from 'react';

export const DriverDetailDrawer: React.FC<{ driver: any; onClose: () => void }> = ({ driver, onClose }) => {
    if (!driver) return null;

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${driver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0C14] border-l border-white/5 shadow-2xl flex flex-col animate-slide-left">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-black text-primary">
                            {driver.profile?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">{driver.profile?.full_name}</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operator Level {driver.tier || 'Elite'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <i className="fas fa-times text-slate-500 text-xs"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-2xl font-black text-white tracking-tighter">${Number(driver.daily_earnings || 0).toFixed(2)}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Daily Yield</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-2xl font-black text-white tracking-tighter">{driver.completed_deliveries || 0}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Missions Success</p>
                        </div>
                    </div>

                    {/* Performance Detailed */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-b border-white/5 pb-4">Performance Metrics</h4>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">PSR (Package Success Rate)</p>
                                <p className="text-xs font-black text-white">{driver.speed_score}%</p>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: `${driver.speed_score}%` }}></div>
                            </div>

                            <div className="flex justify-between items-end pt-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Mission Acceptance</p>
                                <p className="text-xs font-black text-white">{Math.round((driver.acceptance_rate || 1) * 100)}%</p>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${(driver.acceptance_rate || 1) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-b border-white/5 pb-4">Shift Event Archive</h4>
                        <div className="space-y-6 relative border-l border-white/5 ml-2 pl-6">
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-4 border-[#0A0C14]"></div>
                                <p className="text-[10px] font-black text-white uppercase">Operational Status Shift: LIVE</p>
                                <p className="text-[9px] text-slate-500 mt-1 uppercase">Today, 08:42:15</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-4 border-[#0A0C14]"></div>
                                <p className="text-[10px] font-black text-white uppercase">Mission Success: #8A21C0</p>
                                <p className="text-[9px] text-slate-500 mt-1 uppercase">Today, 10:15:30</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-black/40 grid grid-cols-2 gap-4">
                    <button className="py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                        Contact Op
                    </button>
                    <button className="py-4 bg-red-600/10 border border-red-600/20 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600/20 transition-all">
                        Audit Lock
                    </button>
                </div>
            </div>
        </div>
    );
};
