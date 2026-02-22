import { useState } from "react";
import { HashRouter } from "react-router-dom";
import { SettingsProvider } from "@/app/contexts/SettingsContext";
import AnimatedSplash from "@/components/AnimatedSplash";
import { InstallGate } from "@/components/InstallGate";
import InstallLanding from "@/components/InstallLanding";
import AppShell from "@/layouts/AppShell";
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

  const [showLanding] = useState<boolean>(() => {
    // Mobile-first environment detection (synchronous check)
    if (typeof window === 'undefined') return false; // Server-side guard

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    return isMobile && !isStandalone;
  });

  // Effect not needed anymore for initialization, but kept if we need to listen for resize/installation changes
  // For now, static check on mount is enough as PWA mode doesn't change mid-session usually.

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setIsSplashDone(true);
  };

  // Check if we need to block for PWA check
  if (isSplashDone && showLanding === null) return null;

  return (
    <SettingsProvider>
      <HashRouter>
        {!isSplashDone ? (
          <AnimatedSplash onComplete={handleSplashComplete} />
        ) : showLanding ? (
          <InstallLanding />
        ) : (
          <AppShell />
        )}
      </HashRouter>
    </SettingsProvider>
  );
}

export default App;
