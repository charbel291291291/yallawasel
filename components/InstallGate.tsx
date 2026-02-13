import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";

interface InstallGateProps {
  children: React.ReactNode;
}

// Check if app is running in standalone mode (installed PWA)
const isStandalone = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

// Detect iOS device
const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Detect mobile device
const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const InstallGate: React.FC<InstallGateProps> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissCount, setDismissCount] = useState(0);
  const [isIOSDevice] = useState(isIOS());
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    // Initial check with startTransition for better performance
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

      // Check if already dismissed multiple times
      const savedDismissCount = localStorage.getItem("pwa_dismiss_count");
      const count = savedDismissCount ? parseInt(savedDismissCount, 10) : 0;

      if (count < 3) {
        setShowInstallPrompt(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);

    // Check if app was just installed - use less frequent checks
    const checkInstalled = () => {
      if (isStandalone()) {
        startTransition(() => {
          setIsInstalled(true);
          setShowInstallPrompt(false);
        });
      }
    };

    // Check for installation every 10 seconds (reduced for performance)
    const interval = setInterval(checkInstalled, 10000);

    // Also check immediately on visibility change (user returns from install)
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
        handleBeforeInstall as any
      );
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      const { outcome } = await deferredPrompt.prompt();

      startTransition(() => {
        if (outcome === "accepted") {
          setIsInstalled(true);
          setShowInstallPrompt(false);
        } else {
          // User dismissed - increment count
          const newCount = dismissCount + 1;
          setDismissCount(newCount);
          localStorage.setItem("pwa_dismiss_count", newCount.toString());

          if (newCount >= 3) {
            setShowInstallPrompt(false);
          }
        }
      });
    } catch (error) {
      console.error("Install prompt error:", error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    startTransition(() => {
      const newCount = dismissCount + 1;
      setDismissCount(newCount);
      localStorage.setItem("pwa_dismiss_count", newCount.toString());

      if (newCount >= 3) {
        setShowInstallPrompt(false);
      }
    });
  };

  // Show loading while checking
  if (isInstalled === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-4xl font-black text-white">YW</span>
          </div>
        </div>
      </div>
    );
  }

  // App is installed - allow access
  if (isInstalled) {
    return <>{children}</>;
  }

  // Desktop - no install gate needed, allow access
  if (!isMobile) {
    return <>{children}</>;
  }

  // Mobile but not installed - show install gate
  return (
    <>
      {children}
      {(!isInstalled || showInstallPrompt) && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center px-8 max-w-md">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-28 h-28 mx-auto rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-2xl">
                <span className="text-5xl font-black text-white">YW</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
              Install Yalla Wasel
            </h1>

            {/* Subtitle */}
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Get the full experience with offline access, faster loading, and
              exclusive app features.
            </p>

            {/* Install Button (Android/Chrome) */}
            {deferredPrompt && !isIOSDevice && (
              <button
                onClick={handleInstall}
                className="w-full py-4 px-8 bg-white text-red-900 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mb-4"
              >
                Install App Now
              </button>
            )}

            {/* iOS Instructions */}
            {isIOSDevice && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/20">
                <div className="text-white font-bold text-lg mb-3">
                  iPhone/iPad Installation
                </div>
                <ol className="text-white/80 text-left space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    Tap the Share button below
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    Scroll down and tap "Add to Home Screen"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    Tap "Add" to install
                  </li>
                </ol>
              </div>
            )}

            {/* Dismiss Button (after multiple attempts) */}
            {dismissCount >= 3 && (
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white text-sm underline transition-colors"
              >
                Continue anyway
              </button>
            )}

            {/* Install prompt message when dismissed */}
            {!deferredPrompt && !isIOSDevice && (
              <p className="text-white/60 text-sm mt-4">
                Please install the app to continue using Yalla Wasel
              </p>
            )}
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 text-white/40 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Secure • Fast • Reliable
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallGate;
