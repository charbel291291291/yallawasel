import React, { useState } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';

export const EarningsPanel: React.FC = () => {
    const { driverStats, shiftEarnings, shiftMissions, currentStreak, isShiftActive, tier } = useDriverStore();
    const { t, isRTL } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    if (!isShiftActive) return null;

    const stats = driverStats || {
        daily_earnings: 0,
        weekly_earnings: 0,
        completed_deliveries: 0,
        acceptance_rate: 1.0,
        completion_rate: 1.0,
        average_rating: 4.8,
    };

    const targetMissions = 12;
    const progress = Math.min((shiftMissions / targetMissions) * 100, 100);

    return (
        <section className={`p-6 ${isRTL ? 'font-arabic' : ''}`}>
            <div className="terminal-card overflow-hidden bg-gradient-to-br from-[#1A1A22] to-[#0E0E11] border-white/5 shadow-2xl">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-6 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-6">
                        {/* Gamified Progress Ring */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-16 h-16 rotate-[-90deg]">
                                <circle
                                    cx="32" cy="32" r="28"
                                    className="stroke-white/5 fill-none"
                                    strokeWidth="5"
                                />
                                <circle
                                    cx="32" cy="32" r="28"
                                    className="stroke-red-600 fill-none transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                    strokeWidth="5"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[16px] font-black text-white tabular-nums">{shiftMissions}</span>
                                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{t('common.missions')}</span>
                            </div>
                        </div>

                        <div className="text-left">
                            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] block mb-1">{t('common.earnings')}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-black text-white tracking-tighter leading-none tabular-nums">
                                    ${shiftEarnings.toFixed(2)}
                                </span>
                                {currentStreak > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 rounded-md border border-yellow-500/20 text-yellow-500">
                                        <i className="fas fa-fire text-[8px] animate-pulse"></i>
                                        <span className="text-[8px] font-black tracking-widest uppercase">STREAK x{currentStreak}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <i className={`fas fa-chevron-down text-white/10 group-hover:text-red-500 transition-all ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isOpen && (
                    <div className="px-6 pb-8 animate-entrance">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 group hover:bg-white/[0.08] transition-all">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">Completion Weight</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-lg font-black text-white tracking-tighter">{~~(stats.completion_rate * 100)}%</span>
                                    <i className="fas fa-check-double text-blue-500/40 text-[10px]"></i>
                                </div>
                            </div>
                            <div className={`bg-white/5 rounded-2xl p-5 border border-white/5 group hover:bg-white/[0.08] transition-all ${tier === 'Gold' ? 'border-yellow-500/20' : tier === 'Silver' ? 'border-gray-400/20' : ''
                                }`}>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">{tier} Benefits</span>
                                <div className="flex items-end justify-between">
                                    <span className={`text-lg font-black tracking-tighter ${tier === 'Gold' ? 'text-yellow-500' : tier === 'Silver' ? 'text-gray-400' : 'text-orange-600'
                                        }`}>
                                        {tier === 'Gold' ? 'x1.2 Multi' : tier === 'Silver' ? 'x1.1 Multi' : 'Standard'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Momentum Progress Readout */}
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Sector Dominance Progress</span>
                                <span className="text-[10px] font-black text-white tracking-tighter uppercase">{progress.toFixed(0)}% OF QUOTA</span>
                            </div>
                            <div className="flex gap-1.5 w-full">
                                {[...Array(targetMissions)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-3 rounded-full transition-all duration-700 ${i < shiftMissions ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-white/5'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
