import React, { useEffect } from 'react';
import { TerminalLayout } from '../../layouts/TerminalLayout';
import { useDriverStore } from '../../store/useDriverStore';
import { useI18n } from '../../hooks/useI18n';
import { TopBar } from './components/TopBar';
import { StatusBar } from './components/StatusBar';
import { ActiveOrderPanel } from './components/ActiveOrderPanel';
import { IncomingOrdersPanel } from './components/IncomingOrdersPanel';
import { EarningsPanel } from './components/EarningsPanel';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { BottomActionBar } from './components/BottomActionBar';
import { OnboardingFlow } from './components/OnboardingFlow';
import { WalletPanel } from './components/WalletPanel';
import { HeatMapPanel } from './components/HeatMapPanel';
import { useRealtime } from '../../hooks/useRealtime';

export const TerminalPage: React.FC = () => {
    const { status, activeOrder, isShiftActive, onboardingCompleted, connectionStatus } = useDriverStore();
    const { isRTL, t } = useI18n();

    // Establish production realtime uplink
    useRealtime();

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = isRTL ? 'ar' : 'en';
    }, [isRTL]);

    if (!onboardingCompleted) {
        return <OnboardingFlow />;
    }

    return (
        <TerminalLayout>
            <TopBar />
            <StatusBar />

            {/* Mission Critical Transition Layer */}
            {connectionStatus !== 'stable' && (
                <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-3 text-center animate-pulse z-[200] sticky top-20 shadow-xl">
                    <div className="flex items-center justify-center gap-3">
                        <i className="fas fa-triangle-exclamation"></i>
                        {t('common.reconnecting')}
                    </div>
                </div>
            )}

            <main className={`flex-1 w-full max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-12 gap-0 lg:gap-2 transition-all duration-1000 ${status === 'MISSION_ACTIVE' ? 'bg-blue-600/[0.02]' : ''
                }`}>
                {/* Tactical Operations Zone */}
                <div className="md:col-span-8 lg:col-span-7 space-y-0 relative order-2 md:order-1">
                    {!isShiftActive ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 py-32 text-center animate-entrance">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-red-600/10 blur-[60px] rounded-full animate-pulse"></div>
                                <div className="w-24 h-24 border-2 border-white/5 rounded-full flex items-center justify-center relative z-10 animate-spin-slow">
                                    <i className="fas fa-fingerprint text-white/10 text-3xl"></i>
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-white tracking-[0.4em] uppercase mb-4">{t('terminal.locked')}</h2>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                                {t('terminal.authorization')}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-entrance scroll-mt-24">
                            {activeOrder ? (
                                <ActiveOrderPanel />
                            ) : (
                                <>
                                    <IncomingOrdersPanel />
                                    <HeatMapPanel />
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Tactical Intelligence Zone */}
                <div className={`md:col-span-4 lg:col-span-5 flex flex-col gap-0 transition-opacity duration-500 order-1 md:order-2 ${!isShiftActive ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
                    <EarningsPanel />
                    <WalletPanel />
                    <ActivityLogPanel />
                </div>
            </main>

            <BottomActionBar />

            {/* Contextual Transition Overlays */}
            {status === 'MISSION_ACTIVE' && (
                <div className="fixed inset-0 pointer-events-none border-[20px] border-blue-500/10 z-[80] shadow-[inset_0_0_100px_rgba(59,130,246,0.1)]"></div>
            )}

            {connectionStatus === 'offline' && (status === 'OFFLINE') && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[90] pointer-events-none transition-opacity duration-700"></div>
            )}
        </TerminalLayout>
    );
};
