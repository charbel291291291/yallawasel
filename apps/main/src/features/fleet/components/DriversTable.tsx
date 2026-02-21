import React from 'react';

export const DriversTable: React.FC<{ drivers: any[]; onSelect: (driver: any) => void }> = ({ drivers, onSelect }) => {
    return (
        <div className="bg-[#11131A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                    <i className="fas fa-id-card text-primary opacity-50"></i>
                    Operator Manifest
                </h3>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest ">
                    {drivers.length} Nodes Online
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reliability</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Yield</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Update</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {drivers.map((driver) => (
                            <tr
                                key={driver.id}
                                onClick={() => onSelect(driver)}
                                className="hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {driver.profile?.full_name?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white group-hover:text-primary transition-colors">{driver.profile?.full_name}</p>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase">#{driver.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${driver.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${driver.is_online ? 'text-green-500' : 'text-slate-600'}`}>
                                            {driver.is_online ? 'Live' : 'Standby'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest bg-white/5 border border-white/10 ${driver.tier === 'Gold' ? 'text-yellow-500 border-yellow-500/20' :
                                            driver.tier === 'Silver' ? 'text-slate-300' : 'text-orange-600'
                                        }`}>
                                        {driver.tier || 'Bronze'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${driver.speed_score || 0}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-bold mt-1 block text-slate-600 uppercase tracking-widest">{driver.speed_score || 0}% PSR</span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-white">
                                    ${Number(driver.daily_earnings || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tabular-nums">
                                        {new Date(driver.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
