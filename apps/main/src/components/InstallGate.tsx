import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

/**
 * LUXURY PWA INSTALL GATE
 * Enforces the high-end mobile experience and provides the "Install-First" onboarding.
 */
export const InstallGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useStore();
  const isRTL = lang === 'ar';

  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [, setIsInstalled] = useState(false);
  const [, setIsMobile] = useState(false);
  const [showInstallScreen, setShowInstallScreen] = useState(false);

  useEffect(() => {
    // Environment Detection
    const mobileCheck = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(standaloneCheck);

    // Don't show install screen if already installed or on desktop
    if (!standaloneCheck && mobileCheck) {
      setShowInstallScreen(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallScreen(false);
    });

    // Simulate a smooth luxury transition
    const timer = setTimeout(() => setIsLoading(false), 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS Fallback instruction would go here if needed
      alert(isRTL ? 'يرجى استخدام قائمة المشاركة والاختيار "إضافة إلى الشاشة الرئيسية"' : 'Please use the share menu and select "Add to Home Screen"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSkip = () => {
    setShowInstallScreen(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0B0E17] flex items-center justify-center z-[9999]">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 bg-[#C8A951]/20 rounded-full blur-xl absolute"></div>
            <img src="/icons/favicon.png" alt="Logo" className="w-12 h-12 relative z-10 opacity-20" />
          </div>
        </div>
      </div>
    );
  }

  if (showInstallScreen) {
    return (
      <div className={`fixed inset-0 bg-[#0B0E17] z-[5000] flex flex-col items-center justify-center p-8 text-center bg-luxury-glow ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C8A951]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm animate-entrance">
          <div className="w-24 h-24 bg-[#151821] border border-[#C8A951]/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
            <img src="/icons/favicon.png" alt="Icon" className="w-12 h-12" />
          </div>

          <h1 className="text-3xl font-luxury text-white mb-4 tracking-tight leading-tight">
            {isRTL ? 'ثبت التطبيق على جهازك' : 'Install the App on Your Device'}
          </h1>

          <p className="text-sm font-medium text-white/40 leading-relaxed mb-12 px-4">
            {isRTL ? 'احصل على تجربة أسرع وسلسة عن طريق تثبيت التطبيق.' : 'Get a faster and smoother experience by installing the app.'}
          </p>

          <div className="space-y-4">
            <button
              onClick={handleInstall}
              className="btn-luxury btn-luxury-gold w-full"
            >
              {isRTL ? 'تثبيت الآن' : 'INSTALL NOW'}
            </button>

            <button
              onClick={handleSkip}
              className="btn-luxury btn-luxury-outline w-full"
            >
              {isRTL ? 'عبر المتصفح' : 'CONTINUE IN BROWSER'}
            </button>
          </div>

          <p className="mt-12 text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">
            Terminal Status: Standby
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
