import React, { useState } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';

export const BottomActionBar: React.FC = () => {
    const {
        status,
        isShiftActive,
        startShift,
        endShift,
        shiftMissions,
        shiftEarnings
    } = useDriverStore();

    const { t, isRTL } = useI18n();
    const [showSummary, setShowSummary] = useState(false);

    const handleEndShift = () => {
        setShowSummary(true);
    };

    const confirmEndShift = () => {
        endShift();
        setShowSummary(false);
    };

    if (!isShiftActive) {
        return (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0E0E11] via-[#0E0E11] to-transparent pt-12 pb-safe z-50">
                <button
                    onClick={startShift}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-7 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-2xl shadow-red-600/30 group"
                >
                    <i className="fas fa-bolt text-lg group-hover:animate-pulse"></i>
                    <span className="text-sm uppercase tracking-[0.3em] font-black">{t('terminal.start_shift')}</span>
                </button>
            </div>
        );
    }

    if (showSummary) {
        return (
            <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-8">
                <div className="w-full max-w-sm space-y-12 text-center animate-entrance">
                    <div className="relative">
                        <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/20 relative z-10">
                            <i className="fas fa-flag-checkered text-red-600 text-3xl"></i>
                        </div>
                        <div className="absolute inset-0 bg-red-600/5 blur-[80px] rounded-full"></div>
                        <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">Shift Debrief</h2>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Final Assessment Summary</p>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="bg-[#151519]/80 p-8">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-3">{t('common.earnings')}</span>
                            <span className="text-2xl font-black text-white tracking-tighter tabular-nums">${shiftEarnings.toFixed(2)}</span>
                        </div>
                        <div className="bg-[#151519]/80 p-8">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-3">{t('common.missions')}</span>
                            <span className="text-2xl font-black text-white tracking-tighter">{shiftMissions}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 pt-8">
                        <button
                            onClick={confirmEndShift}
                            className="bg-red-600 text-white font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-red-600/20 border border-red-500/20"
                        >
                            Confirm Termination
                        </button>
                        <button
                            onClick={() => setShowSummary(false)}
                            className="text-white/20 hover:text-white font-black text-[10px] uppercase tracking-[0.4em] py-4 transition-all"
                        >
                            Return to Mission
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0E0E11] via-[#0E0E11] to-transparent pt-12 pb-safe flex gap-4 z-50">
            {status === 'IDLE' ? (
                <>
                    <button
                        onClick={handleEndShift}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-[9px] border border-white/5"
                    >
                        {t('terminal.end_shift')}
                    </button>
                    <button
                        className="flex-[2.5] bg-white group hover:bg-green-600 text-black hover:text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-white/5"
                    >
                        <i className="fas fa-tower-broadcast text-[10px] group-hover:animate-bounce transition-transform"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Analytics</span>
                    </button>
                </>
            ) : (
                <>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-[9px] border border-white/5 flex items-center justify-center gap-3">
                        <i className="fas fa-headset text-[10px]"></i>
                        Comms
                    </button>
                    <button className="flex-[3] bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/30 group">
                        <i className={`fas fa-map-location-dot text-[10px] transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}></i>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Initiate Tactical Nav</span>
                    </button>
                </>
            )}
        </div>
    );
};
