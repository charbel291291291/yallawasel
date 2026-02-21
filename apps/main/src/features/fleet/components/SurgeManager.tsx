import React, { useState } from 'react';

export const SurgeManager: React.FC = () => {
    const [selectedZone, setSelectedZone] = useState('');
    const [multiplier, setMultiplier] = useState(1.5);
    const [duration, setDuration] = useState(60);

    const zones = [
        { id: '1', name: 'Beirut Central' },
        { id: '2', name: 'Ashrafieh' },
        { id: '3', name: 'Hamra' },
        { id: '4', name: 'Mar Mikhael' },
    ];

    return (
        <div className="bg-[#11131A] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <i className="fas fa-bolt text-primary text-xl"></i>
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white underline decoration-primary/30 underline-offset-4">Incentive Protocol</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Surge Injection</p>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Target Sector</label>
                    <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                        <option value="">Select Operational Zone...</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Multiplier</label>
                        <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                            <input
                                type="range"
                                min="1.0"
                                max="3.5"
                                step="0.1"
                                value={multiplier}
                                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                                className="flex-1 accent-primary h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-black text-primary tabular-nums">{multiplier}x</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Duration (Min)</label>
                        <div className="flex items-center gap-2">
                            {[15, 30, 60, 120].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${duration === d ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-slate-600'
                                        }`}
                                >
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button className="w-full py-4 bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(185,151,91,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale" disabled={!selectedZone}>
                    Execute Surge Protocol
                </button>

                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.3em] text-center">
                    Warning: This will override system demand calculations
                </p>
            </div>
        </div>
    );
};
