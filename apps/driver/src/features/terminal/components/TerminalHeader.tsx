import React from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useDriverTerminal } from '../useDriverTerminal';

export const TerminalHeader: React.FC = () => {
    const { isOnline, status, profile } = useDriverStore();
    const { toggleOnline } = useDriverTerminal();

    return (
        <header className="px-8 py-8 flex items-center justify-between relative z-50">
            <div className="flex items-center gap-6">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
                    } animate-pulse`}></div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-1">
                        Station {profile?.full_name?.split(' ')[0] || 'Unit'}
                    </h1>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        Mode: {status.replace('_', ' ')}
                    </p>
                </div>
            </div>

            <button
                onClick={toggleOnline}
                className={`relative h-12 w-32 rounded-2xl border transition-all flex items-center px-2 group ${isOnline
                        ? 'bg-green-500/10 border-green-500/30 text-green-500'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
            >
                <div className={`w-8 h-8 rounded-xl transition-all duration-500 shadow-lg ${isOnline
                        ? 'translate-x-[72px] bg-green-500 shadow-green-500/50'
                        : 'translate-x-0 bg-white/20'
                    }`}></div>
                <span className={`absolute left-0 right-0 text-center text-[9px] font-black uppercase tracking-widest pointer-events-none transition-opacity ${isOnline ? 'opacity-0' : 'opacity-100'
                    }`}>Go Live</span>
            </button>
        </header>
    );
};
