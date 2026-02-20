import React from "react";
import PWAInstallButton from "./PWAInstallButton";
import DriverInstallButton from "./DriverInstallButton";

const InstallLanding: React.FC = () => {
  return (
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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .btn-base {
          width: 100%;
          max-width: 280px;
          padding: 1rem 2rem;
          font-weight: 900;
          font-size: 1.1rem;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }
        .btn-primary {
          background: white;
          color: #8a1c1c;
        }
        .btn-primary:active {
          transform: scale(0.98);
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }
        .btn-secondary:active {
          transform: scale(0.98);
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
            src="/assets/Logo.png"
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

        <p style={{ color: "#fbbf24", fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
          Deliver Smarter. Faster. Better.
        </p>

        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Install the app for the full premium experience.
        </p>

        {/* Action Buttons */}
        <PWAInstallButton className="btn-base btn-primary" />

        <DriverInstallButton className="btn-base btn-secondary" />

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", marginTop: "1rem" }}>
          Works on iOS • Android • Desktop
        </p>
      </div>

      <div style={{ position: "absolute", bottom: "2rem", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
          Secure • Fast • Reliable
        </p>
      </div>
    </div>
  );
};

export default InstallLanding;
