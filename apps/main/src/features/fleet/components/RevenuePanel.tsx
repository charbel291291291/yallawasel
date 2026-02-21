import React from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

export const RevenuePanel: React.FC<{ data: any[] }> = ({ data = [] }) => {
    // Mock data for initial design validation if data is empty
    const chartData = data.length > 0 ? data : [
        { hour: '08:00', revenue: 450 },
        { hour: '10:00', revenue: 820 },
        { hour: '12:00', revenue: 1250 },
        { hour: '14:00', revenue: 980 },
        { hour: '16:00', revenue: 1100 },
        { hour: '18:00', revenue: 1850 },
        { hour: '20:00', revenue: 1400 },
        { hour: '22:00', revenue: 600 },
    ];

    return (
        <div className="bg-[#11131A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white underline decoration-primary/50 underline-offset-8">Revenue Analytics</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">24h Performance Uplink</p>
                </div>
                <div className="flex gap-2">
                    {['24h', '7d', '30d'].map(p => (
                        <button key={p} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${p === '24h' ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/10'
                            }`}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#B9975B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#B9975B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                            dx={-15}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0A0C14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#white', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                            labelStyle={{ fontSize: '9px', fontWeight: 900, color: '#475569', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#B9975B"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-4 gap-4 border-t border-white/5 pt-8">
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Surge Bonus</p>
                    <p className="text-sm font-black text-white">18.4%</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peak Hour</p>
                    <p className="text-sm font-black text-white">18:00 - 20:00</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Margin Avg</p>
                    <p className="text-sm font-black text-white">24.2%</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Sector</p>
                    <p className="text-sm font-black text-white">Beirut Central</p>
                </div>
            </div>
        </div>
    );
};
