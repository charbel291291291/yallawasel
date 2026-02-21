import React, { useState, useEffect } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';

export const StatusBar: React.FC = () => {
    const { status, isOnline, currentStreak, surgeMultiplier, heatLevel } = useDriverStore();
    const { t } = useI18n();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        if (!isOnline) return {
            color: 'bg-white/5 text-white/30 border-white/5',
            label: t('common.offline'),
            icon: 'fa-moon'
        };

        switch (status) {
            case 'IDLE': return {
                color: 'bg-green-500/10 text-green-500 border-green-500/10',
                label: t('terminal.scanning'),
                icon: 'fa-radar'
            };
            case 'MISSION_ACTIVE': return {
                color: 'bg-blue-500/10 text-blue-400 border-blue-500/10',
                label: t('mission.active'),
                icon: 'fa-crosshairs'
            };
            case 'PICKED_UP':
            case 'DELIVERING': return {
                color: 'bg-red-500/10 text-red-500 border-red-500/10',
                label: t('mission.delivering'),
                icon: 'fa-truck-fast'
            };
            default: return {
                color: 'bg-white/5 text-white/40 border-white/5',
                label: t('common.loading'),
                icon: 'fa-sync'
            };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`px-6 py-2.5 flex items-center justify-between border-b transition-all duration-700 ${config.color}`}>
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-current opacity-20 rounded-full animate-ping"></div>
                    <i className={`fas ${config.icon} text-[10px] relative z-10`}></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {config.label}
                </span>
            </div>

            <div className="flex items-center gap-6">
                {/* Surge Indicator */}
                <div className="hidden xs:flex items-center gap-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Surge</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-red-500 leading-none">x{surgeMultiplier.toFixed(1)}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-0.5 h-2 rounded-full ${heatLevel === 'high' ? 'bg-red-500' : heatLevel === 'medium' ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Momentum Counter */}
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[7px] font-black text-current/40 uppercase tracking-widest">{t('common.streak')}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-tighter text-current">x{currentStreak}</span>
                        <i className={`fas fa-bolt text-[8px] ${currentStreak > 0 ? 'text-yellow-500' : 'text-white/10'}`}></i>
                    </div>
                </div>

                {/* Session Clock */}
                <div className="flex flex-col items-end border-l border-white/5 pl-5">
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">Delta</span>
                    <span className="text-[11px] font-mono font-black tracking-widest leading-none text-white/60">
                        {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
    );
};
