import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
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
  // We only block if splash is ALREADY done. 
  // If splash is NOT done, we show splash immediately while PWA check runs in bg.
  if (isSplashDone && showLanding === null) return null;

  return (
    <SettingsProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
