import React, { useState, useEffect } from "react";

const InstallLanding: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall as any
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
    } catch (error) {
      console.error("Install error:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
        className="fade-in"
        style={{ textAlign: "center", maxWidth: "320px" }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <img
            src="/assets/logo.png"
            alt="Yalla Wasel"
            style={{
              width: "96px",
              height: "96px",
              objectFit: "contain",
              borderRadius: "24px",
            }}
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

        {/* Install Button */}
        {deferredPrompt && !isIOS && (
          <button
            onClick={handleInstall}
            style={{
              width: "100%",
              padding: "1rem 2rem",
              background: "white",
              color: "#8a1c1c",
              fontWeight: 900,
              fontSize: "1rem",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              marginBottom: "1rem",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
            }}
          >
            Install the App
          </button>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              borderRadius: "16px",
              padding: "1rem",
              marginBottom: "1rem",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <p
              style={{
                color: "white",
                fontWeight: 600,
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              To install on iPhone/iPad:
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>
              Tap Share → Add to Home Screen
            </p>
          </div>
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
