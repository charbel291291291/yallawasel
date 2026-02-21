import React from 'react';

export const HeatMapPanel: React.FC = () => {

    // Mock Hotspots for Tactical Visualization
    const hotspots = [
        { top: '30%', left: '40%', size: '120px', intensity: 'high' },
        { top: '60%', left: '70%', size: '80px', intensity: 'medium' },
        { top: '20%', left: '20%', size: '100px', intensity: 'low' }
    ];

    return (
        <section className="p-6 pt-0">
            <div className="terminal-card overflow-hidden h-[300px] relative bg-[#151519] border-white/5 group">
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-[#0E0E11] to-transparent z-10 flex justify-between items-center">
                    <div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Area Heatmap</h4>
                        <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1 animate-pulse">Live: Sector High Demand</p>
                    </div>
                    <div className="px-3 py-1 bg-black/60 rounded-lg border border-white/10 flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-600 rounded-full animate-ping"></div>
                        <span className="text-[8px] font-black text-white/60 tracking-widest">REAL-TIME</span>
                    </div>
                </div>

                {/* Grid Background Mock */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                {/* Visual Map Texture */}
                <div className="absolute inset-0 opacity-[0.05] grayscale brightness-50 contrast-125" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }}></div>

                {/* Tactical Hotspots */}
                <div className="relative w-full h-full overflow-hidden">
                    {hotspots.map((spot, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-full blur-[40px] animate-pulse transition-all duration-1000 ${spot.intensity === 'high' ? 'bg-red-600/30' :
                                spot.intensity === 'medium' ? 'bg-orange-600/20' : 'bg-yellow-600/10'
                                }`}
                            style={{
                                top: spot.top,
                                left: spot.left,
                                width: spot.size,
                                height: spot.size
                            }}
                        ></div>
                    ))}

                    {/* User Unit Representation */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                        <div className="absolute inset-[-8px] border border-white/20 rounded-full animate-ping"></div>
                    </div>
                </div>

                {/* Tactical Legend */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1 bg-black/40 p-2 rounded-lg backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600/60 blur-[2px] rounded-full"></div>
                            <span className="text-[7px] font-black text-white/40 uppercase">Maximum Surge</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-600/40 blur-[2px] rounded-full"></div>
                            <span className="text-[7px] font-black text-white/40 uppercase">Expanding Demand</span>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all">
                        Magnify Sector
                    </button>
                </div>
            </div>
        </section>
    );
};
