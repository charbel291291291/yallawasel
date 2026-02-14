import React, { useState, useEffect } from "react";

// Store deferredPrompt at module level - persists across renders
let deferredPromptGlobal: any = null;

const InstallLanding: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      // App is already installed, redirect to main app
      window.location.reload();
      return;
    }

    // Capture beforeinstallprompt event - this is the key to native install!
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      // Store the event for later use
      deferredPromptGlobal = e;
      setCanInstall(true);
      console.log("beforeinstallprompt captured!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log("App installed successfully");
      window.location.reload();
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle the Install button click
  const handleInstallClick = async () => {
    console.log(
      "Install clicked, canInstall:",
      canInstall,
      "deferredPrompt:",
      !!deferredPromptGlobal
    );

    // If we have the deferred prompt, try native install first
    if (deferredPromptGlobal) {
      setIsInstalling(true);
      try {
        const { outcome } = await deferredPromptGlobal.prompt();
        console.log("Install outcome:", outcome);

        if (outcome === "accepted") {
          // App will install, page will reload
          console.log("Installing...");
        } else {
          // User dismissed, show the manual instructions
          setIsInstalling(false);
          setShowInstallToast(true);
        }
      } catch (error) {
        console.error("Install error:", error);
        setIsInstalling(false);
        setShowInstallToast(true);
      }
    } else {
      // No deferred prompt - show install instructions anyway
      console.log("No deferred prompt, showing instructions");
      setShowInstallToast(true);
    }
  };

  // Close the instruction popup
  const closeToast = () => {
    setShowInstallToast(false);
  };

  // Dismiss the top banner
  const dismissBanner = () => {
    setBannerDismissed(true);
  };

  // Determine if we should show the top banner
  const showTopBanner = canInstall && !bannerDismissed && !isIOS;

  return (
    <>
      {/* Top Install Banner - Shows when browser supports PWA install */}
      {showTopBanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99998,
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <img
              src="/assets/logo.png"
              alt="Yalla Wasel"
              style={{ width: "32px", height: "32px", borderRadius: "8px" }}
            />
            <div>
              <div
                style={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}
              >
                Install Yalla Wasel App
              </div>
              <div
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}
              >
                Add to home screen for best experience
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={handleInstallClick}
              style={{
                padding: "0.5rem 1rem",
                background: "#3b82f6",
                color: "white",
                fontWeight: 600,
                fontSize: "0.85rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Install
            </button>
            <button
              onClick={dismissBanner}
              style={{
                padding: "0.5rem",
                background: "transparent",
                color: "rgba(255,255,255,0.6)",
                fontSize: "1.25rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Landing Page */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          width: "100vw",
          height: "100vh",
          background:
            "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
          padding: "2rem",
          paddingTop: showTopBanner ? "5rem" : "2rem",
          boxSizing: "border-box",
          overflow: "auto",
        }}
      >
        {/* Fade in animation */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
        `}</style>

        <div
          className="fade-in flex flex-col items-center justify-center text-center"
          style={{ maxWidth: "320px" }}
        >
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <img
              src="/assets/logo.png"
              alt="Yalla Wasel"
              className="w-40 h-40 object-contain"
            />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "white",
              marginBottom: "0.5rem",
              lineHeight: 1.2,
            }}
          >
            Yalla Wasel <span style={{ fontSize: "1.5rem" }}>🚀</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              color: "#fbbf24",
              fontSize: "1.125rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Deliver Smarter. Faster. Better.
          </p>

          {/* Description */}
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            Install the app for a smoother experience,
            <br />
            exclusive offers,
            <br />
            and real-time order tracking.
          </p>

          {/* Bullet points */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              borderRadius: "16px",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#4ade80" }}>✔</span>
                <span>Faster performance</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#4ade80" }}>✔</span>
                <span>Exclusive deals</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#4ade80" }}>✔</span>
                <span>Live order tracking</span>
              </div>
            </div>
          </div>

          {/* MAIN INSTALL BUTTON - Always clickable */}
          <button
            onClick={handleInstallClick}
            className="mt-8 bg-white text-primary font-bold px-8 py-3 rounded-xl shadow-md transition hover:scale-105 active:scale-95"
            style={{
              width: "100%",
              maxWidth: "280px",
            }}
          >
            {isInstalling ? "Installing..." : "Install the App"}
          </button>

          {/* Hint text */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.7rem",
              marginTop: "1rem",
            }}
          >
            Tap to install or get setup instructions
          </p>
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.75rem",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4ade80",
              }}
            ></div>
            Secure • Fast • Reliable
          </div>
        </div>
      </div>

      {/* Install Instructions Popup */}
      {showInstallToast && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={closeToast}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "320px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #8a1c1c 0%, #6b1515 100%)",
                padding: "1.25rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  margin: "0 auto 0.5rem",
                  background: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>📱</span>
              </div>
              <h3
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  margin: 0,
                }}
              >
                How to Install
              </h3>
            </div>

            {/* Content */}
            <div style={{ padding: "1.25rem" }}>
              {isIOS ? (
                <div>
                  <p
                    style={{
                      color: "#374151",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    iPhone / iPad Installation
                  </p>
                  <ol
                    style={{
                      color: "#4b5563",
                      fontSize: "0.85rem",
                      paddingLeft: "1.25rem",
                      lineHeight: 2,
                      margin: 0,
                    }}
                  >
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Tap</strong> the
                      Share button below
                    </li>
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Scroll down</strong>{" "}
                      and tap "Add to Home Screen"
                    </li>
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Tap</strong> "Add" in
                      top right
                    </li>
                  </ol>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      color: "#374151",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    Android / Chrome Installation
                  </p>
                  <ol
                    style={{
                      color: "#4b5563",
                      fontSize: "0.85rem",
                      paddingLeft: "1.25rem",
                      lineHeight: 2,
                      margin: 0,
                    }}
                  >
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Tap</strong> the menu
                      (three dots) in browser
                    </li>
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Select</strong> "Add
                      to Home Screen"
                    </li>
                    <li>
                      <strong style={{ color: "#8a1c1c" }}>Tap</strong> "Add" to
                      confirm
                    </li>
                  </ol>
                  {canInstall && (
                    <button
                      onClick={handleInstallClick}
                      style={{
                        marginTop: "1rem",
                        width: "100%",
                        padding: "0.75rem",
                        background: "#8a1c1c",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Or tap here to install directly
                    </button>
                  )}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={closeToast}
                style={{
                  marginTop: "1.25rem",
                  width: "100%",
                  padding: "0.75rem",
                  background: "#f3f4f6",
                  color: "#4b5563",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallLanding;
