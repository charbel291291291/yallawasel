import React from 'react';

export const HeatMapPanel: React.FC = () => {
    // We'll use a stylized grid to represent zones since we don't want a heavy Leaflet dependency here
    const zones = [
        { name: 'Beirut Central', demand: 95, drivers: 12, surge: 1.8 },
        { name: 'Ashrafieh', demand: 75, drivers: 8, surge: 1.2 },
        { name: 'Hamra', demand: 45, drivers: 15, surge: 1.0 },
        { name: 'Mar Mikhael', demand: 88, drivers: 4, surge: 2.5 },
        { name: 'Badaro', demand: 30, drivers: 6, surge: 1.0 },
        { name: 'Hazmieh', demand: 20, drivers: 10, surge: 1.0 },
    ];

    return (
        <div className="bg-[#11131A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                    <i className="fas fa-map-marked-alt text-blue-500 opacity-50"></i>
                    Sector Demand
                </h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-[9px] font-black text-slate-500 uppercase">Live Heatmap</span>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {zones.map((zone) => (
                    <div key={zone.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${zone.demand > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                    zone.demand > 50 ? 'bg-orange-500' : 'bg-blue-500'
                                }`}
                        ></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter mb-1">{zone.name}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    {zone.drivers} Drivers in Node
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-[11px] font-black ${zone.surge > 1 ? 'text-primary' : 'text-slate-600'}`}>
                                    {zone.surge}x Surge
                                </p>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                                    Intensity: {zone.demand}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${zone.demand > 80 ? 'bg-red-500' :
                                        zone.demand > 50 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${zone.demand}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
                <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Optimize Dispatch Zones
                </button>
            </div>
        </div>
    );
};
