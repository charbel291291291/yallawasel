import React, { useState, useEffect, startTransition } from "react";

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
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const InstallGate: React.FC<InstallGateProps> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOSDevice] = useState(isIOS());
  const [isMobile] = useState(isMobileDevice());

  useEffect(() => {
    // Prevent bypass via dev tools - clear body content
    if (isMobile && !isStandalone()) {
      document.body.innerHTML = "";
    }

    // Initial check
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
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);

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
        handleBeforeInstall as any
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
      const { outcome } = await deferredPrompt.prompt();

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

  // Show loading while checking - render nothing until verified
  if (isInstalled === null) {
    return (
      <div
        className="fixed inset-0 z-[99999]"
        style={{
          background:
            "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
        }}
      >
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">
            <img
              src="/assets/icon-192.png"
              alt="Yalla Wasel"
              className="w-20 h-20 rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop - allow access
  if (!isMobile) {
    return <>{children}</>;
  }

  // Mobile + Installed - allow access
  if (isInstalled) {
    return <>{children}</>;
  }

  // Mobile + NOT installed - STRICT BLOCK (no children rendered)
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

      <div className="relative z-10 text-center px-8 max-w-md">
        {/* Logo using new PWA icon */}
        <div className="mb-8">
          <img
            src="/assets/icon-192.png"
            alt="Yalla Wasel"
            className="w-28 h-28 mx-auto rounded-3xl shadow-2xl border-2 border-white/20"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
          Install App to Continue
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-lg mb-8 leading-relaxed">
          Yalla Wasel requires installation for the best experience.
        </p>

        {/* Benefits */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20 text-left">
          <h3 className="text-white font-bold text-sm mb-3">Why install?</h3>
          <ul className="space-y-2 text-white/80 text-sm">
            <li className="flex items-center gap-2">
              <i className="fas fa-check text-green-400"></i>
              Faster loading & smooth experience
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check text-green-400"></i>
              Offline access to content
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check text-green-400"></i>
              Full-screen app experience
            </li>
            <li className="flex items-center gap-2">
              <i className="fas fa-check text-green-400"></i>
              Receive notifications
            </li>
          </ul>
        </div>

        {/* Install Button (Android/Chrome) */}
        {deferredPrompt && !isIOSDevice && (
          <button
            onClick={handleInstall}
            className="w-full py-4 px-8 bg-white text-red-900 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mb-4"
          >
            Install Now
          </button>
        )}

        {/* iOS Instructions */}
        {isIOSDevice && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/20">
            <div className="text-white font-bold text-lg mb-3">
              iPhone/iPad Installation
            </div>
            <ol className="text-white/80 text-left space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </span>
                Tap the <span className="font-bold text-white">Share</span>{" "}
                button below
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </span>
                Scroll down and tap{" "}
                <span className="font-bold text-white">Add to Home Screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </span>
                Tap <span className="font-bold text-white">Add</span> to install
              </li>
            </ol>
          </div>
        )}

        {/* Strict message - NO bypass option */}
        <div className="mt-6 p-4 bg-red-900/50 rounded-xl border border-red-700">
          <p className="text-white font-bold text-sm">
            <i className="fas fa-lock mr-2"></i>
            Installation is required to access this platform
          </p>
          <p className="text-white/60 text-xs mt-2">
            Please install the app and reopen to continue
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-white/40 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Secure • Fast • Reliable
        </div>
      </div>
    </div>
  );
};

export default InstallGate;
