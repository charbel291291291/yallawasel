import React, { useState, useEffect, useCallback } from "react";

// Global prompt handler
let deferredPromptGlobal: any = null;

const InstallLanding: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check for install support on mount
  useEffect(() => {
    // Detect iOS
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = 
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any)?.standalone === true;
    
    if (isStandalone) {
      // Already installed - reload to go to app
      window.location.reload();
      return;
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setCanInstall(true);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed
    const handleAppInstalled = () => {
      window.location.reload();
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle install button click - IMMEDIATE action
  const handleInstallClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Install button clicked!");
    setIsInstalling(true);

    // Try native install first
    if (deferredPromptGlobal) {
      try {
        const { outcome } = await deferredPromptGlobal.prompt();
        console.log("Install outcome:", outcome);
        
        if (outcome === "accepted") {
          // App will install
          setIsInstalling(false);
          return;
        }
      } catch (err) {
        console.error("Install error:", err);
      }
    }
    
    // If we get here, show the manual instructions modal
    setIsInstalling(false);
    setShowModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      {/* Full screen landing page */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          boxSizing: "border-box",
          overflow: "auto",
          zIndex: 9999,
        }}
      >
        {/* Animation styles */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          .install-btn:active {
            transform: scale(0.98) !important;
          }
        `}</style>

        <div
          className="fade-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "320px",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "2rem" }}>
            <img
              src="/assets/logo.png"
              alt="Yalla Wasel"
              style={{
                width: "160px",
                height: "160px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "white", marginBottom: "0.5rem" }}>
            Yalla Wasel 🚀
          </h1>

          {/* Subtitle */}
          <p style={{ color: "#fbbf24", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
            Deliver Smarter. Faster. Better.
          </p>

          {/* Description */}
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Install the app for a smoother experience,<br/>
            exclusive offers,<br/>
            and real-time order tracking.
          </p>

          {/* Benefits box */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <p style={{ color: "white", fontSize: "0.875rem" }}>
              <span style={{ color: "#4ade80" }}>✔</span> Faster performance<br/>
              <span style={{ color: "#4ade80" }}>✔</span> Exclusive deals<br/>
              <span style={{ color: "#4ade80" }}>✔</span> Live order tracking
            </p>
          </div>

          {/* INSTALL BUTTON - FULLY FUNCTIONAL */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="install-btn"
            style={{
              width: "100%",
              maxWidth: "280px",
              padding: "1rem 2rem",
              background: "white",
              color: "#8a1c1c",
              fontWeight: 900,
              fontSize: "1.1rem",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              transition: "all 0.2s ease",
              animation: isInstalling ? "pulse 1s infinite" : "none",
            }}
          >
            {isInstalling ? "Installing..." : "📲 Install the App"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", marginTop: "1rem" }}>
            Tap to install • Works on all devices
          </p>
        </div>

        {/* Bottom */}
        <div style={{ position: "absolute", bottom: "2rem", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span> Secure • Fast • Reliable
          </p>
        </div>
      </div>

      {/* Instructions Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "340px",
              width: "100%",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #8a1c1c 0%, #6b1515 100%)",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  margin: "0 auto 0.5rem",
                  background: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                }}
              >
                📱
              </div>
              <h3 style={{ color: "white", fontWeight: 800, fontSize: "1.25rem", margin: 0 }}>
                How to Install
              </h3>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem" }}>
              {isIOS ? (
                <>
                  <p style={{ color: "#1f2937", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>
                    iPhone / iPad
                  </p>
                  <ol style={{ color: "#4b5563", fontSize: "0.9rem", paddingLeft: "1.25rem", lineHeight: 2, margin: 0 }}>
                    <li>Tap the <strong style={{ color: "#8a1c1c" }}>Share</strong> button</li>
                    <li>Scroll down and tap <strong style={{ color: "#8a1c1c" }}>Add to Home Screen</strong></li>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Add</strong> in top right</li>
                  </ol>
                </>
              ) : (
                <>
                  <p style={{ color: "#1f2937", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>
                    Android / Chrome
                  </p>
                  <ol style={{ color: "#4b5563", fontSize: "0.9rem", paddingLeft: "1.25rem", lineHeight: 2, margin: 0 }}>
                    <li>Tap the <strong style={{ color: "#8a1c1c" }}>menu</strong> (three dots) in browser</li>
                    <li>Select <strong style={{ color: "#8a1c1c" }}>Add to Home Screen</strong></li>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Add</strong> to confirm</li>
                  </ol>
                </>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={closeModal}
                style={{
                  marginTop: "1.5rem",
                  width: "100%",
                  padding: "0.875rem",
                  background: "#8a1c1c",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.95rem",
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
