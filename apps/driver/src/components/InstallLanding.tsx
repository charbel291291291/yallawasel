import React, { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useDriverStore } from '../store/useDriverStore';

/**
 * PREMIUM PWA LANDING & INSTALL SYSTEM
 * High-fidelity immersive onboarding experience for the Driver App.
 * Theme: Deep Navy, Metallic Gold, Glowing Red.
 */
export const InstallLanding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { t, isRTL, language } = useI18n();
    const { setLanguage } = useDriverStore();
    const [isLoading, setIsLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Detect if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        // Simulate high-fidelity loading
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsLoading(false), 800);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearInterval(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#0A0C14] z-[3000] flex flex-col items-center justify-center p-8 overflow-hidden select-none">
                {/* Immersive Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_#B9975B_1px,_transparent_1px)] bg-[length:40px_40px]"></div>

                    {/* Light Streaks */}
                    <div className="absolute top-[20%] -left-full w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent animate-[streak_4s_infinite]"></div>
                    <div className="absolute top-[80%] -right-full w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/10 to-transparent animate-[streak_6s_infinite_reverse]"></div>
                </div>

                <div className="relative flex flex-col items-center">
                    {/* Logo Section with 3D Float */}
                    <div className="w-24 h-24 mb-12 relative animate-[float_4s_infinite_ease-in-out]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#B9975B] to-[#D4AF37] rounded-3xl rotate-12 blur-2xl opacity-20"></div>
                        <div className="relative w-full h-full bg-[#151821] border border-[#B9975B]/30 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <i className="fas fa-satellite-dish text-3xl text-[#B9975B]"></i>
                        </div>
                        {/* Orbiting Ring */}
                        <div className="absolute -inset-4 border border-[#B9975B]/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    </div>

                    {/* Progress Loader */}
                    <div className={`text-center ${isRTL ? 'font-arabic' : ''}`}>
                        <h2 className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mb-6 animate-pulse">
                            {t('pwa.loading_app')}
                        </h2>

                        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative mb-2">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B9975B] to-[#D4AF37] transition-all duration-300 shadow-[0_0_10px_#B9975B]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#B9975B]">{progress}%</span>
                    </div>
                </div>

                {/* Tactical Detail */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 font-black text-[7px] text-white/10 uppercase tracking-[0.5em]">
                    <span>Secure Uplink: Est</span>
                    <span>Vector: 04-X</span>
                </div>

                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(3deg); }
                    }
                    @keyframes streak {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(200%); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 bg-[#0A0C14] z-[3000] flex flex-col items-center justify-center p-8 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#B9975B]/5 blur-[150px] rounded-full"></div>
            </div>

            {/* Language Toggle */}
            <div className="absolute top-12 right-12 z-50">
                <button
                    onClick={toggleLanguage}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white/60 tracking-widest uppercase transition-all active:scale-95"
                >
                    {language === 'en' ? 'Arabic' : 'English'}
                </button>
            </div>

            <div className="relative w-full max-w-sm animate-entrance">
                {/* Main Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B9975B]/10 to-transparent -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl"></div>

                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-[#151821] border border-[#B9975B]/20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#B9975B]/5 to-transparent"></div>
                            {isInstalled ? (
                                <i className="fas fa-check-circle text-3xl text-green-500 animate-bounce"></i>
                            ) : (
                                <i className="fas fa-download text-3xl text-[#B9975B]"></i>
                            )}
                        </div>

                        <h1 className="text-2xl font-black text-white mb-4 tracking-tight leading-tight">
                            {isInstalled ? t('pwa.already_installed') : t('pwa.install_title')}
                        </h1>

                        <p className="text-sm font-medium text-white/40 leading-relaxed mb-10 px-4">
                            {t('pwa.install_desc')}
                        </p>

                        {!isInstalled && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="w-full bg-gradient-to-r from-[#B9975B] to-[#D4AF37] hover:shadow-[0_0_30px_rgba(185,151,91,0.3)] text-black font-black py-5 rounded-2xl transition-all active:scale-[0.98] text-xs tracking-widest uppercase"
                            >
                                {t('pwa.install_now')}
                            </button>
                        )}

                        {isInstalled && (
                            <button
                                onClick={onComplete}
                                className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all active:scale-[0.98] text-xs tracking-widest uppercase"
                            >
                                {t('onboarding.get_started')}
                            </button>
                        )}

                        {!isInstalled && !deferredPrompt && (
                            <button
                                onClick={onComplete}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-black py-5 rounded-2xl transition-all active:scale-[0.98] text-[10px] tracking-[0.2em] uppercase border border-white/5"
                            >
                                {t('onboarding.get_started')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Badges */}
                <div className="mt-8 flex justify-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <i className="fas fa-shield-alt text-[8px] text-[#B9975B]"></i>
                        <span className="text-[7px] font-black text-white/50 tracking-widest uppercase">Secured System</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <i className="fas fa-bolt text-[8px] text-[#B9975B]"></i>
                        <span className="text-[7px] font-black text-white/50 tracking-widest uppercase">Optimized Phase</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
