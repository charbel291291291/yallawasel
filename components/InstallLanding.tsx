import React, { useState, useEffect } from "react";

// Store deferredPrompt at module level
let deferredPrompt: any = null;

const InstallLanding: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    // Show the small install window
    setShowInstallToast(true);
  };

  const handleInstallNow = async () => {
    setIsInstalling(true);
    
    // Try native install prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          console.log("App installed successfully");
        }
      } catch (error) {
        console.error("Install error:", error);
      }
    }
    
    setIsInstalling(false);
    setShowInstallToast(false);
  };

  const closeToast = () => {
    setShowInstallToast(false);
  };

  return (
    <>
      {/* Main Landing Page */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
          padding: "2rem",
          boxSizing: "border-box",
          overflow: "hidden",
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
          {/* Logo - Larger and centered */}
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

          {/* Install Button - Opens the small window */}
          <button
            onClick={handleInstallClick}
            className="mt-8 bg-white text-primary font-bold px-8 py-3 rounded-xl shadow-md transition hover:scale-105"
            style={{
              width: "100%",
              maxWidth: "280px",
            }}
          >
            Install the App
          </button>
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

      {/* Small Install Window / Toast Notification */}
      {showInstallToast && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={closeToast}
        >
          {/* Small Window */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "300px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with icon */}
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
                <span style={{ fontSize: "1.5rem" }}>📲</span>
              </div>
              <h3
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  margin: 0,
                }}
              >
                Install Yalla Wasel
              </h3>
            </div>

            {/* Content */}
            <div style={{ padding: "1.25rem" }}>
              {isIOS ? (
                <div>
                  <p style={{ color: "#374151", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center" }}>
                    <strong>Quick Install:</strong>
                  </p>
                  <ol style={{ color: "#4b5563", fontSize: "0.8rem", paddingLeft: "1rem", lineHeight: 1.8, margin: 0 }}>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Share</strong> button below</li>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Add to Home Screen</strong></li>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Add</strong> to confirm</li>
                  </ol>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#374151", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center" }}>
                    <strong>Quick Install:</strong>
                  </p>
                  <ol style={{ color: "#4b5563", fontSize: "0.8rem", paddingLeft: "1rem", lineHeight: 1.8, margin: 0 }}>
                    <li>Tap <strong style={{ color: "#8a1c1c" }}>Install</strong> button below</li>
                    <li>Wait for download to complete</li>
                    <li>App will appear on your home screen</li>
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
                {/* Install Button - FUNCTIONAL */}
                <button
                  onClick={handleInstallNow}
                  disabled={isInstalling}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: canInstall ? "#8a1c1c" : "#9ca3af",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    border: "none",
                    borderRadius: "12px",
                    cursor: canInstall ? "pointer" : "not-allowed",
                    opacity: isInstalling ? 0.7 : 1,
                  }}
                >
                  {isInstalling ? "Installing..." : canInstall ? "📲 Install Now" : "Install Unavailable"}
                </button>

                {/* Cancel Button */}
                <button
                  onClick={closeToast}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#f3f4f6",
                    color: "#4b5563",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* Fallback hint */}
              {!canInstall && !isIOS && (
                <p style={{ color: "#9ca3af", fontSize: "0.7rem", textAlign: "center", marginTop: "0.75rem", margin: "0.75rem 0 0" }}>
                  If no install prompt appears, use your browser menu
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallLanding;
