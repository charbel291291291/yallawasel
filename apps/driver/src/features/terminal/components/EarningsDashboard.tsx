import React from 'react';
import { useDriverStore } from '../../../store/useDriverStore';

export const EarningsDashboard: React.FC = () => {
    const { driverStats } = useDriverStore();

    const metrics = [
        { label: 'Today', value: `$${(driverStats?.daily_earnings || 0).toFixed(2)}`, icon: 'fa-wallet', color: 'text-green-400' },
        { label: 'Accepted', value: `${driverStats?.total_accepted || 0}`, icon: 'fa-check-double', color: 'text-blue-400' },
        { label: 'Reliability', value: `${driverStats?.speed_score || 0}%`, icon: 'fa-bolt', color: 'text-yellow-400' },
    ];

    return (
        <div className="bg-black/80 backdrop-blur-3xl border-t border-white/5 px-8 pt-8 pb-12 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Analytics Pulse</h3>
                <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-white/20 uppercase tracking-widest border border-white/5">
                    Live Data
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center group hover:border-white/10 transition-all">
                        <i className={`fas ${m.icon} ${m.color} text-sm mb-3 opacity-40`}></i>
                        <p className="text-xl font-black text-white tracking-tighter mb-1">{m.value}</p>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{m.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">Gold Level Operative</p>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`w-3 h-1 rounded-full ${s <= 4 ? 'bg-yellow-500' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>
                <button className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/10 pb-1">
                    View Full History
                </button>
            </div>
        </div>
    );
};
