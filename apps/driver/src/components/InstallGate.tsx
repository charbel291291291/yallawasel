import React, { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useDriverStore } from '../store/useDriverStore';
import { pwaUtils } from '../utils/pwaUtils';

/**
 * HARDENED INSTALL GATE & PLATFORM LOCK
 * Enforces the "Mobile-Only Standalone" architecture.
 * Redirects or blocks access based on environment compliance.
 */
export const InstallGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t, isRTL, language } = useI18n();
    const { setLanguage } = useDriverStore();

    const [isLoading, setIsLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(pwaUtils.isStandalone());
    const [isMobile] = useState(pwaUtils.isMobile());
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Hydration check
        const checkStatus = () => {
            if (pwaUtils.isStandalone()) {
                setIsInstalled(true);
            }
        };

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            window.location.reload(); // Hard refresh to enter standalone shell if possible
        });

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

        checkStatus();

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

    // 🛑 Rule 1: Desktop Block
    if (!isMobile) {
        return (
            <div className="fixed inset-0 bg-[#0A0C14] flex flex-col items-center justify-center p-12 text-center select-none overflow-hidden">
                <div className="w-24 h-24 bg-red-600/10 rounded-3xl flex items-center justify-center mb-8 border border-red-600/20">
                    <i className="fas fa-mobile-alt text-4xl text-red-600 animate-pulse"></i>
                </div>
                <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-4">Mobile Only System</h1>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest max-w-[280px] leading-relaxed">
                    The Driver Terminal is a specialized tactical environment explicitly locked to mobile mobile devices.
                </p>
            </div>
        );
    }

    // ⏳ Loading State (Tactical Sync)
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#0A0C14] z-[3000] flex flex-col items-center justify-center p-8 overflow-hidden select-none">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[100px] rounded-full"></div>
                </div>
                <div className="relative flex flex-col items-center">
                    <div className="w-20 h-20 mb-10 relative animate-pulse">
                        <div className="absolute inset-0 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                            <i className="fas fa-id-card text-2xl text-white/20"></i>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-4">Establishing Secure Node Link</h2>
                        <div className="w-32 h-[1px] bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Render Content if COMPLIANT (Mobile + Standalone)
    if (isInstalled) {
        return <>{children}</>;
    }

    // 🔑 Rule 2: Install Mandatory (Not standalone)
    return (
        <div className={`fixed inset-0 bg-[#0A0C14] z-[3000] flex flex-col items-center justify-center p-8 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#B9975B]/5 blur-[100px] rounded-full"></div>
            </div>

            {/* Language Toggle */}
            <div className="absolute top-10 right-10">
                <button
                    onClick={toggleLanguage}
                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black text-white/50 tracking-widest uppercase active:scale-95 transition-transform"
                >
                    {language === 'en' ? 'AR' : 'EN'}
                </button>
            </div>

            <div className="relative w-full max-w-sm animate-entrance text-center">
                <div className="mb-12">
                    <div className="w-20 h-20 bg-[#151821] border border-[#B9975B]/20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl rotate-3">
                        <i className="fas fa-download text-3xl text-[#B9975B]"></i>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-3 tracking-tighter">
                        {t('pwa.install_title')}
                    </h1>
                    <p className="text-sm font-medium text-white/30 leading-relaxed mb-10 px-6">
                        {t('pwa.install_desc')}
                    </p>
                </div>

                {deferredPrompt ? (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-gradient-to-r from-[#B9975B] to-[#D4AF37] text-black font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-all text-xs tracking-widest uppercase mb-4"
                    >
                        {t('pwa.install_now')}
                    </button>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                        <span className="text-[10px] font-black text-[#B9975B] uppercase tracking-widest block mb-4 italic">Manual Installation Required:</span>
                        <div className="flex items-center gap-4 text-white/60 mb-3">
                            <i className="fas fa-share-square"></i>
                            <span className="text-[11px] font-bold">1. Tap the Share button in Safari</span>
                        </div>
                        <div className="flex items-center gap-4 text-white/60">
                            <i className="fas fa-plus-square"></i>
                            <span className="text-[11px] font-bold">2. Select "Add to Home Screen"</span>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                    Terminal Status: Standby
                </p>
            </div>
        </div>
    );
};
