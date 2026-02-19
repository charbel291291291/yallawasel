import React, { useState, useEffect, startTransition } from "react";

interface InstallGateProps {
  children: React.ReactNode;
}

// Check if app is running in standalone mode (installed PWA)
const isStandalone = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

// Detect iOS device
const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Detect mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const InstallGate: React.FC<InstallGateProps> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isIOSDevice] = useState(isIOS());
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    // Initial check - use startTransition to prevent blocking
    startTransition(() => {
      setIsInstalled(isStandalone());
    });

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        startTransition(() => {
          setIsInstalled(true);
        });
      }
    };
    mediaQuery.addEventListener("change", handleChange);

    // Capture beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Check if app was just installed
    const checkInstalled = () => {
      if (isStandalone()) {
        startTransition(() => {
          setIsInstalled(true);
        });
      }
    };

    // Check periodically (less frequent for performance)
    const interval = setInterval(checkInstalled, 15000);

    // Also check on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInstalled();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall
      );
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMobile]);

  // Prevent right-click and text selection on mobile
  useEffect(() => {
    if (isMobile && !isInstalled) {
      const preventDefault = (e: Event) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener("contextmenu", preventDefault);
      document.addEventListener("selectstart", preventDefault);
      document.addEventListener("dragstart", preventDefault);

      // Prevent keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.key === "F12") {
          e.preventDefault();
        }
      });

      return () => {
        document.removeEventListener("contextmenu", preventDefault);
        document.removeEventListener("selectstart", preventDefault);
        document.removeEventListener("dragstart", preventDefault);
      };
    }
  }, [isMobile, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      const { outcome } = await (deferredPrompt as unknown as { prompt: () => Promise<{ outcome: string }> }).prompt();

      if (outcome === "accepted") {
        startTransition(() => {
          setIsInstalled(true);
        });
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }

    setDeferredPrompt(null);
  };

  // While checking, show install screen (never return null/blank)
  // This ensures no blank page ever
  const showInstallScreen = isInstalled === null || !isMobile || !isInstalled;

  // Desktop or installed - render children
  if (!isMobile || isInstalled) {
    return <>{children}</>;
  }

  // Mobile + NOT installed - Show install landing page
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
        overflow: "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center px-8 max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/assets/icon-192.png"
            alt="Yalla Wasel"
            className="w-24 h-24 mx-auto rounded-3xl shadow-2xl border-2 border-white/20"
          />
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Yalla Wasel <span className="text-3xl">🚀</span>
        </h1>

        {/* Subtitle */}
        <p className="text-yellow-300 text-xl font-bold mb-6">
          وصّل طلباتك أسرع، أذكى، وأسهل
        </p>

        {/* Description */}
        <p className="text-white/80 text-base mb-8 leading-relaxed">
          حمّل التطبيق واستمتع بتجربة أسرع،
          <br />
          عروض حصرية،
          <br />
          وتتبع مباشر لطلباتك.
        </p>

        {/* Benefits */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20 text-right">
          <ul className="space-y-2 text-white/90 text-sm">
            <li className="flex items-center gap-2 justify-end">
              تجربة أسرع وأسهل
              <i className="fas fa-check text-green-400"></i>
            </li>
            <li className="flex items-center gap-2 justify-end">
              عروض حصرية
              <i className="fas fa-check text-green-400"></i>
            </li>
            <li className="flex items-center gap-2 justify-end">
              تتبع مباشر لطلباتك
              <i className="fas fa-check text-green-400"></i>
            </li>
          </ul>
        </div>

        {/* Install Button (Android/Chrome) */}
        {deferredPrompt && !isIOSDevice && (
          <button
            onClick={handleInstall}
            className="w-full py-4 px-8 bg-white text-red-900 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mb-4"
          >
            ثبت التطبيق الآن
          </button>
        )}

        {/* iOS Instructions */}
        {isIOSDevice && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/20">
            <div className="text-white font-bold text-lg mb-3">
              طريقة التثبيت على iPhone/iPad
            </div>
            <ol className="text-white/80 text-right space-y-3 text-sm">
              <li className="flex items-start gap-2 flex-row-reverse">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </span>
                اضغط على زر <span className="font-bold text-white">مشاركة</span>
              </li>
              <li className="flex items-start gap-2 flex-row-reverse">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </span>
                مرر للأسفل واختر{" "}
                <span className="font-bold text-white">
                  أضف إلى الشاشة الرئيسية
                </span>
              </li>
              <li className="flex items-start gap-2 flex-row-reverse">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </span>
                اضغط <span className="font-bold text-white">إضافة</span>
              </li>
            </ol>
          </div>
        )}

        {/* Small note */}
        <div className="mt-4 p-3 bg-red-900/30 rounded-xl">
          <p className="text-white/60 text-xs">
            التطبيق يعمل بأفضل أداء عند التثبيت
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-white/40 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          آمن • سريع • موثوق
        </div>
      </div>
    </div>
  );
};

export default InstallGate;
