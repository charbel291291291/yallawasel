import React from 'react';

export const ActiveMissionsPanel: React.FC<{ missions: any[] }> = ({ missions }) => {
    return (
        <div className="bg-[#11131A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                    <i className="fas fa-satellite-dish text-orange-500 opacity-50"></i>
                    Active Missions
                </h3>
                <span className="animate-pulse w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {missions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20 uppercase tracking-[0.3em]">
                        <i className="fas fa-radar text-4xl mb-4"></i>
                        <p className="text-[10px] font-black">Scanning for cargo activity...</p>
                    </div>
                ) : (
                    missions.map((mission) => (
                        <div key={mission.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${mission.status === 'picked_up' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {mission.status || 'Assigned'}
                                    </span>
                                    <p className="text-[10px] font-black text-white mt-1 uppercase tracking-tighter italic">#{mission.id.slice(0, 8)}</p>
                                </div>
                                <p className="text-xs font-black text-primary">${mission.total || 0}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{mission.pickup_address}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                    <p className="text-[10px] text-white font-bold uppercase truncate">{mission.dropoff_address}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-slate-500">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{mission.driver?.full_name || 'AUTO'}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 tabular-nums">ETA 12m</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
