import React, { useState, useEffect, useRef } from "react";

// Store deferredPrompt at module level
let deferredPrompt: any = null;

const InstallLanding: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

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

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log("No deferredPrompt available");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        console.log("App installed successfully");
      }
    } catch (error) {
      console.error("Install error:", error);
    }
  };

  return (
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

        {/* Install Button - Clickable */}
        <button
          onClick={handleInstall}
          className="mt-8 bg-white text-primary font-bold px-8 py-3 rounded-xl shadow-md transition hover:scale-105"
          style={{
            width: "100%",
            maxWidth: "280px",
          }}
        >
          Install the App
        </button>

        {/* iOS Fallback - Show when no deferredPrompt */}
        {!canInstall && isIOS && (
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.75rem",
              marginTop: "1rem",
            }}
          >
            For iPhone: Tap Share → Add to Home Screen
          </p>
        )}

        {/* Android fallback hint */}
        {!canInstall && !isIOS && (
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.75rem",
              marginTop: "1rem",
            }}
          >
            To install: Use browser menu or bookmark this page
          </p>
        )}
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
  );
};

export default InstallLanding;
