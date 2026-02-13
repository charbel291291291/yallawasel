import React, { useState, useEffect, useRef, useMemo } from "react";

interface HiddenAdminAccessProps {
  children: React.ReactNode;
}

const HiddenAdminAccess: React.FC<HiddenAdminAccessProps> = ({ children }) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const logoRef = useRef<HTMLAnchorElement>(null);
  const terminalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context for beep sound
  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "square";
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);
    } catch (e) {
      // Audio API not supported, skip sound
    }
  };

  // Handle logo clicks for hidden admin access - wrapped in useCallback for performance
  const handleLogoClick = React.useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff > 2000) {
      setClickCount(1);
    } else {
      setClickCount((prev) => {
        const newCount = prev + 1;
        // Check after state update
        if (newCount >= 5) {
          setShowTerminal(true);
          setPin("");
          setError("");
          setShake(false);
          setFailedAttempts(0);

          // Play beep sound when terminal opens
          playBeepSound();

          // Start cursor blinking
          if (cursorIntervalRef.current) {
            clearInterval(cursorIntervalRef.current);
          }
          cursorIntervalRef.current = setInterval(() => {
            setCursorVisible((prev) => !prev);
          }, 500);
        }
        return newCount;
      });
    }
    setLastClickTime(now);
  }, [lastClickTime]);

  // Handle keyboard shortcut: CTRL + SHIFT + L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setShowTerminal(true);
        setPin("");
        setError("");
        setShake(false);
        setFailedAttempts(0);

        // Play beep sound when terminal opens
        playBeepSound();

        // Start cursor blinking
        if (cursorIntervalRef.current) {
          clearInterval(cursorIntervalRef.current);
        }
        cursorIntervalRef.current = setInterval(() => {
          setCursorVisible((prev) => !prev);
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (terminalTimeoutRef.current) {
        clearTimeout(terminalTimeoutRef.current);
      }
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // Close terminal after 3 failed attempts
  useEffect(() => {
    if (failedAttempts >= 3) {
      if (terminalTimeoutRef.current) {
        clearTimeout(terminalTimeoutRef.current);
      }
      terminalTimeoutRef.current = setTimeout(() => {
        setShowTerminal(false);
        setPin("");
        setError("");
        setShake(false);
      }, 2000);
    }
  }, [failedAttempts]);

  // Handle PIN submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "969696") {
      // Success: store admin session in localStorage and redirect
      localStorage.setItem("isAdmin", "true");
      setShowTerminal(false);
      setPin("");
      setError("");
      window.location.hash = "#/admin";
      window.location.reload();
    } else {
      // Failure: show error, shake animation, and increment failed attempts
      setError("ACCESS DENIED");
      setShake(true);
      setFailedAttempts((prev) => prev + 1);

      // Reset shake animation after it completes
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 500);
    }
  };

  // Handle PIN input
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
      setError("");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (terminalTimeoutRef.current) {
        clearTimeout(terminalTimeoutRef.current);
      }
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // Handle children - either clone single element or render multiple children
  // Memoize to avoid unnecessary re-renders
  const renderedChildren = useMemo(() => {
    if (!children) return null;

    // If children is a single valid React element
    if (React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement,
        {
          ...((children as React.ReactElement).props as object),
          onLogoClick: handleLogoClick,
        } as any
      );
    }

    // If children is an array, find and clone the first element (Navbar)
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement,
            {
              ...((child as React.ReactElement).props as object),
              onLogoClick:
                index === 0
                  ? handleLogoClick
                  : ((child as React.ReactElement).props as any)?.onLogoClick,
            } as any
          );
        }
        return child;
      });
    }

    // Otherwise return as is
    return children;
  }, [children, handleLogoClick]);

  return (
    <>
      {renderedChildren}

      {/* Hidden Admin Terminal Modal */}
      {showTerminal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="w-full max-w-sm">
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border-2 border-gold p-6 font-mono overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
              {/* Luxury Safe Design Elements */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-900/20 to-transparent"></div>

              {/* Decorative Elements */}
              <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-gold/50"></div>
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gold/50"></div>
              <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-gold/50"></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-gold/50"></div>

              {/* Center Yalla Wasel Logo */}
              <div className="flex justify-center mb-6 relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center border-4 border-white/20 shadow-2xl shadow-gold/30 transform transition-transform hover:scale-105">
                  <div className="text-2xl font-bold text-white">YW</div>
                </div>
              </div>

              <div className={`relative z-10 ${shake ? "animate-shake" : ""}`}>
                <h2 className="text-xl font-bold mb-1 text-center text-white">
                  LUXURY SAFE
                </h2>
                <p className="text-center text-gold/70 text-sm mb-6">
                  Enter Admin Access Code
                </p>

                <div className="mb-6">
                  <p className="text-center text-white mb-2">
                    Initializing secure channel...
                  </p>
                  <p className="text-center text-gold mb-4">Enter Admin PIN:</p>

                  {/* PIN Dots Indicator */}
                  <div className="flex justify-center mb-6">
                    <div className="flex space-x-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full border ${
                            i < pin.length
                              ? "bg-gold border-gold"
                              : "bg-transparent border-gold/50"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setPin((prev) => prev + num.toString())
                          }
                          className="h-14 rounded-xl bg-gradient-to-b from-gray-700 to-gray-800 text-gold font-bold text-xl shadow-lg active:shadow-inner active:translate-y-0.5 border border-gray-600 hover:from-gray-600 hover:to-gray-700 transition-all duration-150 transform hover:scale-105 active:scale-95"
                        >
                          {num}
                        </button>
                      ))}

                      {/* Backspace button */}
                      <button
                        type="button"
                        onClick={() => setPin((prev) => prev.slice(0, -1))}
                        className="h-14 rounded-xl bg-gradient-to-b from-red-700 to-red-800 text-white font-bold shadow-lg active:shadow-inner active:translate-y-0.5 border border-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-150 transform hover:scale-105 active:scale-95"
                      >
                        ←
                      </button>

                      {/* 0 button */}
                      <button
                        type="button"
                        onClick={() => setPin((prev) => prev + "0")}
                        className="h-14 rounded-xl bg-gradient-to-b from-gray-700 to-gray-800 text-gold font-bold text-xl shadow-lg active:shadow-inner active:translate-y-0.5 border border-gray-600 hover:from-gray-600 hover:to-gray-700 transition-all duration-150 transform hover:scale-105 active:scale-95"
                      >
                        0
                      </button>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={pin.length !== 6}
                        className={`h-14 rounded-xl font-bold shadow-lg active:shadow-inner active:translate-y-0.5 border transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                          pin.length === 6
                            ? "bg-gradient-to-b from-gold to-yellow-600 text-gray-900 hover:from-yellow-400 hover:to-yellow-500"
                            : "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                        }`}
                      >
                        🔓
                      </button>
                    </div>

                    {error && (
                      <div className="text-red-400 text-center mb-4 animate-pulse">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTerminal(false);
                          setPin("");
                          setError("");
                          setShake(false);
                        }}
                        className="px-4 py-2 bg-red-900/50 border border-red-700/50 text-red-300 hover:bg-red-800/70 rounded-lg transition-all"
                      >
                        EXIT
                      </button>
                    </div>
                  </form>
                </div>

                <div className="text-xs text-gold/60 mt-4 flex items-center">
                  <span>Status: </span>
                  <span className="ml-2 flex h-3 w-3">
                    <span className="animate-ping absolute h-3 w-3 rounded-full bg-gold opacity-75"></span>
                    <span className="relative h-3 w-3 rounded-full bg-gold"></span>
                  </span>
                  <span className="ml-auto">
                    {cursorVisible ? "|" : "\u00A0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add shake animation style if not already present */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </>
  );
};

export default HiddenAdminAccess;
