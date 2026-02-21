import React, { useState, useEffect } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';

export const ActiveOrderPanel: React.FC = () => {
    const { activeOrder, updateOrderStatus, completeOrder, surgeMultiplier } = useDriverStore();
    const { t, isRTL } = useI18n();
    const [taskTime, setTaskTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTaskTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!activeOrder) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getPhaseInfo = () => {
        switch (activeOrder.status) {
            case 'assigned':
            case 'accepted': return {
                label: 'PHASE 1: INFILTRATION',
                action: t('mission.arrived_pickup'),
                next: 'picked_up',
                desc: 'Proceed to source location for package acquisition'
            };
            case 'picked_up': return {
                label: 'PHASE 2: TRANSPORT',
                action: t('mission.picked_up'),
                next: 'delivering',
                desc: 'Cargo acquired. Transitioning to target sector'
            };
            case 'delivering': return {
                label: 'PHASE 3: EXTRACTION',
                action: t('mission.complete'),
                next: 'delivered',
                desc: 'Approaching target. Prepare final verification'
            };
            default: return null;
        }
    };

    const phase = getPhaseInfo();

    const handleAction = async () => {
        if (!phase || isProcessing) return;
        setIsProcessing(true);

        try {
            if (phase.next === 'delivered') {
                await completeOrder();
            } else {
                await updateOrderStatus(phase.next as any);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const totalPayout = activeOrder.payout_base * surgeMultiplier + activeOrder.payout_bonus;

    return (
        <section className={`p-6 pt-2 animate-entrance relative ${isRTL ? 'font-arabic' : ''}`}>
            {/* Mission Active Glow */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full animate-pulse"></div>

            <div className="terminal-card overflow-hidden border-blue-500/20 shadow-2xl shadow-blue-900/10 bg-[#151519]">
                {/* Tactical Header */}
                <div className="bg-blue-500/10 p-5 px-6 border-b border-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block leading-none mb-1">
                                {phase?.label}
                            </span>
                            <h2 className="text-xs font-black text-white tracking-widest uppercase truncate max-w-[180px]">
                                MISSION REF-{activeOrder.id.slice(0, 8)}
                            </h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex flex-col items-end">
                            <span className="text-[14px] font-black text-white tracking-tighter tabular-nums leading-none">{formatTime(taskTime)}</span>
                            <span className="text-[7px] font-black text-blue-400/50 uppercase tracking-widest mt-1">Delta Elapsed</span>
                        </div>
                    </div>
                </div>

                {/* Logistics Viewport */}
                <div className="p-6 relative">
                    <div className="mb-10">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-8 px-2 border-l border-blue-500/30">“{phase?.desc}”</p>

                        <div className="space-y-10 relative">
                            {/* Visual Timeline Link */}
                            <div className={`absolute top-2 bottom-2 w-0.5 border-l border-dashed border-blue-500/20 ${isRTL ? 'right-[13px]' : 'left-[13px]'}`}></div>

                            <div className="flex gap-6 relative z-10 items-center">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-500 ${['assigned', 'accepted'].includes(activeOrder.status) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/5 text-white/20'}`}>
                                    <i className="fas fa-satellite text-[10px]"></i>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{t('mission.source')}</span>
                                    <p className="text-xs font-black text-white leading-tight uppercase">{activeOrder.pickup_address}</p>
                                    <div className="mt-1 flex items-center gap-3 text-[9px] font-bold">
                                        <span className="text-blue-400/60 uppercase">{activeOrder.customer_name}</span>
                                        <div className="w-[1px] h-3 bg-white/5"></div>
                                        <a href={`tel:${activeOrder.customer_phone}`} className="text-white/30 hover:text-white transition-colors underline decoration-dotted">Satellite Link</a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 relative z-10 items-center">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-500 ${['picked_up', 'delivering'].includes(activeOrder.status) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/5 text-white/20'}`}>
                                    <i className="fas fa-bullseye text-[10px]"></i>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{t('mission.target')}</span>
                                    <p className="text-xs font-black text-white leading-tight uppercase">{activeOrder.dropoff_address || 'TGT COORDINATES UNKNOWN'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Earnings Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">{t('mission.value')}</span>
                            <span className="text-xl font-black text-white tracking-tighter leading-none">${totalPayout.toFixed(2)}</span>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">{t('mission.bonus')}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-blue-400 tracking-tighter leading-none">+{activeOrder.payout_bonus.toFixed(2)}</span>
                                {surgeMultiplier > 1 && (
                                    <span className="px-1.5 py-0.5 bg-red-600/20 text-red-500 text-[8px] font-black rounded uppercase">x{surgeMultiplier}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* High-Impact Actions */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleAction}
                            disabled={isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 text-white font-black py-6 rounded-2xl transition-all active:scale-[0.98] shadow-2xl shadow-blue-600/20 text-[11px] tracking-[0.3em] relative overflow-hidden group uppercase flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="relative z-10">{phase?.action}</span>
                                    <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                                </>
                            )}
                        </button>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-white/5 hover:bg-white text-white/30 hover:text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[8px]">
                                SOS Link
                            </button>
                            <button className="flex-1 bg-white/5 hover:bg-white text-white/30 hover:text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[8px]">
                                Vector Nav
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
