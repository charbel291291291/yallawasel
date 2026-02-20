import React, { useState, useEffect } from "react";

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set a timer to hide the splash screen after a delay
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Show splash for 2 seconds minimum

    // Cleanup the timer on component unmount
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-primary flex flex-col items-center justify-center">
      <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl animate-float">
        <img
          src="/logo.png"
          alt="Yalla Wasel"
          className="w-24 h-24 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = "/icons/icon-512x512.png";
          }}
        />
      </div>
      <p className="mt-6 text-white font-bold text-lg tracking-widest animate-pulse">
        LOADING...
      </p>
      <div className="mt-8 w-48 h-1 bg-white/30 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full animate-progress-loading"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
