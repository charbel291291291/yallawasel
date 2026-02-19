import { useState, useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedSplash from "@/components/AnimatedSplash";
import InstallGate from "@/components/InstallGate";
import InstallLanding from "@/components/InstallLanding";
import AppShell from "@/components/AppShell";
import ReloadPrompt from "@/components/ReloadPrompt";

/**
 * Main Application Entry Point
 * Implements environment-aware initialization, global providers, and PWA gating.
 */
function App() {
  // Splash Logic: Check session storage to show only once per session
  const [isSplashDone, setIsSplashDone] = useState<boolean>(() => {
    return sessionStorage.getItem("splashShown") === "true";
  });

  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    // Mobile-first environment detection
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Show landing page only if mobile and not yet installed/standalone
    setShowLanding(isMobile && !isStandalone);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setIsSplashDone(true);
  };

  // Check if we need to block for PWA check
  // We only block if splash is ALREADY done. 
  // If splash is NOT done, we show splash immediately while PWA check runs in bg.
  if (isSplashDone && showLanding === null) return null;

  return (
    <SettingsProvider>
      <AuthProvider>
        <HashRouter>
          <ReloadPrompt />
          {/* Render Splash if not done */}
          {!isSplashDone && <AnimatedSplash onComplete={handleSplashComplete} />}

          {/* Render App when Splash is done 
              Use CSS hidden or conditional rendering to prevent unmount/remount 
              issues if heavy init logic exists, but here conditional is cleaner for DOM size.
           */}
          {isSplashDone && (
            <>
              {showLanding ? (
                <InstallLanding />
              ) : (
                <InstallGate>
                  <AppShell />
                </InstallGate>
              )}
            </>
          )}
        </HashRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
