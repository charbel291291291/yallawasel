import React, { useState, useEffect } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';
import { Order } from '../../../types';

export const IncomingOrdersPanel: React.FC = () => {
    const { incomingOrders, isOnline, status, isShiftActive } = useDriverStore();
    const { t } = useI18n();

    if (!isOnline || status !== 'IDLE' || !isShiftActive) return null;

    if (incomingOrders.length === 0) {
        return (
            <div className="p-16 text-center animate-pulse flex flex-col items-center">
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-red-600/5 blur-[40px] rounded-full animate-pulse"></div>
                    <div className="w-24 h-24 border border-white/5 rounded-full flex items-center justify-center relative z-10">
                        <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                            <div className="w-1 h-8 bg-gradient-to-t from-red-600 to-transparent rounded-full origin-bottom"></div>
                        </div>
                        <i className="fas fa-satellite-dish absolute text-white/5 text-xl"></i>
                    </div>
                </div>
                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.5em] mb-2">{t('terminal.scanning')}</h3>
                <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest max-w-[200px]">Waiting for tactical deployment requests...</p>
            </div>
        );
    }

    return (
        <section className="p-6 pt-2 space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{t('terminal.priority_job')}</h3>
                </div>
                <span className="px-2 py-0.5 bg-white/5 rounded-md text-[8px] font-black text-white/40 border border-white/5 tracking-widest uppercase">
                    {incomingOrders.length} Detected
                </span>
            </div>

            <div className="space-y-6">
                {incomingOrders.map((order) => (
                    <MissionCard key={order.id} order={order} />
                ))}
            </div>
        </section>
    );
};

const MissionCard: React.FC<{ order: Order }> = ({ order }) => {
    const { acceptOrder, declineOrder, surgeMultiplier, tier } = useDriverStore();
    const { t, isRTL } = useI18n();
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const duration = 12000;
        const interval = 100;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleDecline();
                    return 0;
                }
                return prev - step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const handleAccept = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setError(null);

        try {
            const success = await acceptOrder(order);
            if (success) {
                setIsExiting(true);
            } else {
                setError('Mission Acquired by Another Unit');
                setIsProcessing(false);
                setTimeout(() => declineOrder(order.id, 'Conflict'), 2000);
            }
        } catch (e) {
            setError('System Link Error');
            setIsProcessing(false);
        }
    };

    const handleDecline = () => {
        setIsExiting(true);
        setTimeout(() => declineOrder(order.id, 'Manual Rejection'), 300);
    };

    const priorityScore = (tier === 'Gold' ? 1.2 : tier === 'Silver' ? 1.1 : 1.0) * surgeMultiplier;

    return (
        <div className={`group relative terminal-card overflow-hidden transition-all duration-500 transform ${isExiting ? 'scale-95 opacity-0 translate-x-12' : 'scale-100 opacity-100 translate-x-0'} ${isRTL ? 'font-arabic' : ''}`}>

            {/* Expiration Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 z-0"></div>
            <div className="absolute top-0 h-[2px] bg-red-600 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(220,38,38,0.5)] z-10" style={{ width: `${progress}%`, left: isRTL ? 'auto' : 0, right: isRTL ? 0 : 'auto' }}></div>

            <div className="p-6 relative z-20">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-0.5 bg-red-600 rounded-md text-[8px] font-black text-white tracking-widest uppercase shadow-lg shadow-red-600/30">
                                {surgeMultiplier > 1 ? `X${surgeMultiplier} SURGE` : 'PRIORITY'}
                            </span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest font-mono">
                                #ID-{order.id.slice(0, 6)}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                                ${(order.payout_base * surgeMultiplier + order.payout_bonus).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-white tracking-tighter tabular-nums">{~~(progress / 10)}</span>
                            <span className="text-[6px] font-black text-white/30 uppercase tracking-widest">Sec</span>
                        </div>
                        {priorityScore > 1.0 && (
                            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 rounded text-yellow-500 border border-yellow-500/20">
                                <i className="fas fa-star text-[7px] animate-pulse"></i>
                                <span className="text-[7px] font-black tracking-widest uppercase">Score: {priorityScore.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error ? (
                    <div className="mb-8 p-4 bg-red-600/10 border border-red-600/20 rounded-xl animate-bounce">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-6 mb-10">
                        <div className="flex items-start gap-4">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                            <div className="flex-1">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{t('mission.source')}</span>
                                <p className="text-xs font-black text-white/80 leading-tight uppercase truncate">{order.pickup_address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-sm bg-white/40"></div>
                            <div className="flex-1">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{t('mission.target')}</span>
                                <p className="text-xs font-black text-white/80 leading-tight uppercase truncate">{order.dropoff_address || 'Sector Grid Coordinates'}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={handleDecline}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-4 rounded-xl border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95 disabled:opacity-20"
                    >
                        {t('common.decline')}
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className={`flex-[2] ${isProcessing ? 'bg-red-600/20' : 'bg-white hover:bg-red-600'} text-black hover:text-white rounded-xl py-4 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-xl shadow-black/40 group/btn`}
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('common.accept')}</span>
                                <i className={`fas fa-arrow-${isRTL ? 'left' : 'right'} text-[9px] group-hover/btn:translate-x-${isRTL ? '-1' : '1'} transition-transform`}></i>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
