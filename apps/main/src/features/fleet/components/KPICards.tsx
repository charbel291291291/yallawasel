import React from 'react';

interface KPIProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
}

const KPICard: React.FC<KPIProps> = ({ label, value, subValue, icon, trend, color }) => (
    <div className="bg-[#11131A] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-${color}-500/10 transition-all`}></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
                <i className={`fas ${icon} text-${color}-500`}></i>
            </div>
            {trend && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${trend === 'up' ? 'text-green-500 bg-green-500/10' :
                        trend === 'down' ? 'text-red-500 bg-red-500/10' : 'text-slate-500 bg-slate-500/10'
                    }`}>
                    {trend === 'up' ? '↑ 12%' : trend === 'down' ? '↓ 5%' : 'STABLE'}
                </span>
            )}
        </div>

        <div className="relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{value}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            {subValue && (
                <p className="mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">{subValue}</p>
            )}
        </div>
    </div>
);

export const KPICards: React.FC<{ kpis: any }> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <KPICard
                label="Active Drivers"
                value={kpis?.active_drivers || 0}
                subValue="In Sector Presence"
                icon="fa-users"
                trend="up"
                color="blue"
            />
            <KPICard
                label="Online Nodes"
                value={kpis?.online_drivers || 0}
                subValue="Network Capacity"
                icon="fa-signal"
                trend="neutral"
                color="green"
            />
            <KPICard
                label="Active Missions"
                value={kpis?.active_missions || 0}
                subValue="Live Assignments"
                icon="fa-box-open"
                trend="up"
                color="orange"
            />
            <KPICard
                label="Completed Today"
                value={kpis?.completed_today || 0}
                subValue="Mission Success"
                icon="fa-check-circle"
                trend="up"
                color="emerald"
            />
            <KPICard
                label="Revenue Today"
                value={`$${Number(kpis?.revenue_today || 0).toFixed(0)}`}
                subValue="Financial Yield"
                icon="fa-hand-holding-usd"
                trend="up"
                color="yellow"
            />
            <KPICard
                label="Avg Delivery"
                value={`${Math.round(kpis?.avg_delivery_time || 0)}m`}
                subValue="Latency Score"
                icon="fa-clock"
                trend="down"
                color="purple"
            />
        </div>
    );
};
