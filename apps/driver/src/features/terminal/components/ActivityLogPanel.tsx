import React from 'react';
import { useDriverStore } from '../../../store/useDriverStore';

export const ActivityLogPanel: React.FC = () => {
    const { logs } = useDriverStore();

    if (logs.length === 0) return null;

    return (
        <section className="p-6 pt-0">
            <h3 className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mb-4 ml-1">Archive: Tactical Log</h3>
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 animate-entrance group hover:bg-white/[0.04] transition-all">
                        <div className="flex gap-4">
                            <div className="mt-1 flex flex-col items-center">
                                <div className={`w-1.5 h-1.5 rounded-full ${getLogColor(log.type)} shadow-lg shadow-current`}></div>
                                <div className="w-[1px] h-4 bg-white/5 mt-1 border-l border-dashed border-white/10"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">
                                    {log.type.replace('_', ' ')}
                                </p>
                                <p className="text-[11px] font-bold text-white/80 leading-tight">
                                    {log.message}
                                </p>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-white/10 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};

const getLogColor = (type: string) => {
    switch (type) {
        case 'accept':
        case 'delivered':
        case 'online':
        case 'connection_restored':
        case 'shift_start': return 'bg-green-500';
        case 'reject':
        case 'offline':
        case 'connection_lost':
        case 'shift_end': return 'bg-red-500';
        default: return 'bg-white/20';
    }
};
