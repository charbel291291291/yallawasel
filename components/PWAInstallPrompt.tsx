import React, { useState, useEffect } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cleanup event listener
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // @ts-ignore
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      // @ts-ignore
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  const handleCloseBanner = () => {
    setShowInstallBanner(false);
  };

  // Check if the app is running in standalone mode
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as any).standalone === true);

  if (!showInstallBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <i className="fa-solid fa-download text-primary text-lg"></i>
        </div>
        <div>
          <p className="font-bold text-gray-900">Install App</p>
          <p className="text-xs text-gray-500">
            Add to home screen for better experience
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCloseBanner}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <i className="fa-solid fa-times text-sm"></i>
        </button>
        <button
          onClick={handleInstallClick}
          className="btn-3d bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
