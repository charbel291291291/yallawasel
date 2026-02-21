import React, { useEffect, useState } from "react";

interface AnimatedSplashProps {
  onComplete: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Total duration: 1800ms
    // 0ms: Mount (Fade In handled by CSS animation)
    // 1400ms: Start Exit
    // 1800ms: Unmount

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1400);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-400 ease-out will-change-opacity ${isExiting ? "opacity-0" : "opacity-100"
        }`}
      aria-hidden="true"
    >
      {/* Cinematic Red Glow Background - Static/Subtle Pulse */}
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(80,0,0,0.6) 0%, rgba(0,0,0,1) 70%)'
        }}
      />

      {/* Red Accent Beam/Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-red-900/20 blur-[100px] rounded-full animate-pulse-slow pointer-events-none z-0"></div>

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          {/* Logo Image */}
          <img
            src="./logo.png"
            alt="Yalla Wasel"
            className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl animate-logo-sequence"
            // Prevent layout shift if image loads late
            width={192}
            height={192}
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = "./icons/icon-512x512.png";
            }}

          />
        </div>
      </div>

      <style>{`
        @keyframes logo-sequence {
          0% {
            opacity: 0;
            transform: scale(0.8);
            filter: blur(10px);
          }
          20% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          70% {
             transform: scale(1);
             filter: drop-shadow(0 0 15px rgba(220, 20, 60, 0.5));
          }
          100% {
            transform: scale(1.05); /* Subtle growth at end */
          }
        }

        .animate-logo-sequence {
          animation: logo-sequence 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity, filter;
        }

        .animate-pulse-slow {
            animation: pulse-red 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-red {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedSplash;
