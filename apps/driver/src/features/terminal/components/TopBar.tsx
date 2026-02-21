import React from 'react';
import { useDriverStore } from '../../../store/useDriverStore';

export const TopBar: React.FC = () => {
    const {
        profile,
        isOnline,
        goOnline,
        goOffline,
        connectionStatus,
        isShiftActive,
        language,
        setLanguage,
        tier,
        INVESTOR_MODE,
        setInvestorMode
    } = useDriverStore();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    const getTierColor = () => {
        switch (tier) {
            case 'Gold': return 'text-yellow-500 shadow-yellow-500/20';
            case 'Silver': return 'text-gray-400 shadow-gray-400/20';
            default: return 'text-orange-600 shadow-orange-600/20';
        }
    };

    return (
        <header className="h-20 bg-[#0E0E11]/95 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100] px-6 flex items-center justify-between pt-safe transition-all duration-500">
            <div className="flex items-center gap-4">
                <div
                    className="relative cursor-help"
                    onDoubleClick={() => setInvestorMode(!INVESTOR_MODE)}
                >
                    <div className={`w-11 h-11 bg-white/[0.03] rounded-2xl flex items-center justify-center font-black overflow-hidden group border border-white/10 ${getTierColor()}`}>
                        <span className="group-hover:translate-y-[-100%] transition-transform duration-300">
                            {profile?.full_name?.charAt(0) || 'D'}
                        </span>
                        <i className={`fas fa-medal absolute translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 text-xs`}></i>
                    </div>
                    {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0E0E11]"></div>
                    )}
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xs font-black text-white uppercase tracking-[0.15em] leading-none">
                            {profile?.full_name || 'Operator'}
                        </h1>
                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-current/20 ${getTierColor()}`}>
                            {tier}
                        </span>
                        {INVESTOR_MODE && (
                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                                Demo Mode
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex gap-0.5 items-end h-1.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`w-0.5 rounded-full transition-all duration-500 ${i <= (connectionStatus === 'stable' ? 4 : 2)
                                        ? 'bg-red-600'
                                        : 'bg-white/5'
                                        }`}
                                    style={{ height: `${i * 25}%` }}
                                ></div>
                            ))}
                        </div>
                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] leading-none">
                            {connectionStatus === 'stable' ? 'Link: Secured' : 'Link: Degraded'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5">
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    {language.toUpperCase()}
                </button>

                {/* Tactical Status */}
                {isShiftActive && (
                    <div className="hidden sm:flex items-center gap-4 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                        <i className="fas fa-satellite-dish text-[10px] text-red-600 animate-pulse"></i>
                    </div>
                )}

                {/* Online Toggle */}
                <button
                    onClick={() => isOnline ? goOffline() : goOnline()}
                    className={`group relative flex items-center justify-between w-26 h-10 px-1 rounded-full border transition-all duration-500 ${isOnline
                        ? 'bg-red-600/10 border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
                        : 'bg-white/5 border-white/10'
                        }`}
                >
                    <span className={`flex-1 text-[8px] font-black uppercase tracking-widest transition-all duration-500 mx-2 ${isOnline ? 'opacity-100 text-red-500' : 'opacity-20'}`}>
                        {isOnline ? 'Active' : 'Standby'}
                    </span>
                    <div className={`w-8 h-8 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${isOnline ? 'bg-red-600 translate-x-0' : 'bg-white/10 -translate-x-14 rtl:translate-x-14'}`}>
                        <i className={`fas fa-power-off text-[10px] text-white transition-opacity ${isOnline ? 'opacity-100' : 'opacity-40'}`}></i>
                    </div>
                </button>
            </div>
        </header>
    );
};
