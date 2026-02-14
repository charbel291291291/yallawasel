import React, { useState, useEffect } from "react";

// Store deferredPrompt at module level
let deferredPrompt: any = null;

const InstallLanding: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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
    // If we have deferredPrompt, try native install
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

    // Show instructions anyway (for all browsers)
    setShowInstructions(true);
  };

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{
          width: "100vw",
          height: "100vh",
          background:
            "linear-gradient(135deg, #8a1c1c 0%, #6b1515 50%, #4a0f0f 100%)",
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

          {/* Install Button - Always Clickable */}
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

      {/* Installation Instructions Notification Modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.7)",
          }}
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 1rem",
                background: "#8a1c1c",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "2rem" }}>📱</span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#1f2937",
                marginBottom: "1rem",
              }}
            >
              How to Install
            </h2>

            {/* iOS Instructions */}
            {isIOS ? (
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    color: "#4b5563",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                  }}
                >
                  Follow these steps to install on your iPhone/iPad:
                </p>
                <ol
                  style={{
                    color: "#374151",
                    fontSize: "0.875rem",
                    paddingLeft: "1.25rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Tap</strong> the{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      Share
                    </span>{" "}
                    button below
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Scroll down</strong> and tap{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      Add to Home Screen
                    </span>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Tap</strong>{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      Add
                    </span>{" "}
                    in the top right
                  </li>
                </ol>
              </div>
            ) : (
              /* Android Instructions */
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    color: "#4b5563",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                  }}
                >
                  Follow these steps to install on your Android:
                </p>
                <ol
                  style={{
                    color: "#374151",
                    fontSize: "0.875rem",
                    paddingLeft: "1.25rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Tap</strong> the{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      three dots
                    </span>{" "}
                    (⋮) in the top right
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Tap</strong>{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      Add to Home Screen
                    </span>
                  </li>
                  <li style={{ marginBottom: "0.5rem" }}>
                    <strong>Tap</strong>{" "}
                    <span style={{ color: "#8a1c1c", fontWeight: 600 }}>
                      Add
                    </span>{" "}
                    to confirm
                  </li>
                </ol>
              </div>
            )}

            {/* Done button */}
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                marginTop: "1.5rem",
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
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallLanding;
