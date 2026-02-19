import React, { useEffect, useRef, useState } from "react";

interface AnimatedSplashProps {
  onComplete: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // 1. Play Sound (Synthesized "Flash" effect)
    const playFlashSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
      } catch (e) {
        // Autoplay policy might block this, ignore
      }
    };

    playFlashSound();

    // 2. Timeline
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Allow exit animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden isolate">
      <style>{`
        @keyframes flash-intro {
          0% { opacity: 0; transform: scale(1.5); filter: blur(20px); }
          20% { opacity: 1; transform: scale(1); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes speed-line {
          0% { transform: translateX(-100%) skewX(-45deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(200%) skewX(-45deg); opacity: 0; }
        }
        .animate-flash-intro {
          animation: flash-intro 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 2s infinite linear;
        }
        .animate-slide-up-delay {
          animation: slide-up 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        .speed-streak {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: skewX(-45deg);
          animation: speed-line 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-black opacity-80"></div>

      {/* Speed Streaks */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="speed-streak" style={{ animationDelay: "0s", top: "-20%" }}></div>
        <div className="speed-streak" style={{ animationDelay: "0.5s", top: "20%" }}></div>
        <div className="speed-streak" style={{ animationDelay: "1s", top: "50%" }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/30 rounded-full blur-[60px] animate-pulse"></div>

        {/* Logo */}
        <div className="animate-flash-intro relative bg-slate-950 rounded-3xl p-6 border border-white/5 shadow-2xl">
          <img
            src="/assets/logo.png"
            alt="Yalla Wasel"
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl relative z-10"
          />
          {/* Shimmer overlay on logo container */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-text" style={{ backgroundSize: '200% 100%', animationDuration: '1.5s' }}></div>
          </div>
        </div>

        {/* Text */}
        <div className="mt-8 text-center animate-slide-up-delay">
          <h1 className="text-4xl md:text-5xl font-luxury font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wider">
            Yalla Wasel
          </h1>
          <div className="h-0.5 w-24 bg-primary mx-auto my-3 rounded-full"></div>
          <p className="text-sm md:text-base text-gray-400 font-medium tracking-[0.2em] uppercase">
            Adonis Luxury Services
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimatedSplash;
