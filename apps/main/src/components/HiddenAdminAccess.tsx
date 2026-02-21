// Hidden Admin Access - Simple wrapper component
import React, { useState, useEffect, useCallback } from "react";

interface HiddenAdminAccessProps {
  children: React.ReactNode;
}

const HiddenAdminAccess: React.FC<HiddenAdminAccessProps> = ({ children }) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const terminalTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Open terminal function
  const openTerminal = useCallback(() => {
    setShowTerminal(true);
    setPin("");
    setError("");
    setShake(false);
    setFailedAttempts(0);
  }, []);

  // Keyboard shortcut: CTRL + SHIFT + L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        openTerminal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openTerminal]);

  // 5 clicks on logo - works on any click, not just links
  useEffect(() => {
    // Store ref to persist across renders
    const clickData = { count: 0, lastTime: 0 };

    const handleClick = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement;
      // Look for logo click anywhere in the app
      const logoElement =
        target.closest('[data-logo="true"]') ||
        target.closest('a[href="/"]') ||
        target.closest('a[href="#/"]') ||
        target.closest(".logo-container") ||
        target.closest(".brand-logo");

      // Also detect rapid taps anywhere (for PWA)
      const now = Date.now();

      if (logoElement || clickData.count > 0) {
        if (now - clickData.lastTime < 400) {
          clickData.count++;
        } else {
          clickData.count = 1;
        }
        clickData.lastTime = now;

        if (clickData.count >= 5) {
          clickData.count = 0;
          openTerminal();
        }
      }
    };

    document.addEventListener("click", handleClick);
    // Also listen for touch events for mobile/PWA
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [openTerminal]);

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
      localStorage.setItem("isAdmin", "true");
      setShowTerminal(false);
      window.location.href = "/admin";
    } else {
      setError("ACCESS DENIED");
      setShake(true);
      setFailedAttempts((prev) => prev + 1);
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 500);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (terminalTimeoutRef.current) clearTimeout(terminalTimeoutRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, []);

  return (
    <>
      {children}

      {showTerminal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full border-2 border-yellow-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">YW</span>
              </div>
              <h2 className="text-xl font-bold text-white">ADMIN ACCESS</h2>
              <p className="text-yellow-500 text-sm">Enter PIN: 969696</p>
            </div>

            <div className={shake ? "animate-shake" : ""}>
              <div className="flex justify-center mb-4">
                <div className="flex space-x-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < pin.length ? "bg-yellow-500" : "bg-gray-700"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPin((prev) => prev + num.toString())}
                      className="h-12 rounded-lg bg-gray-800 text-yellow-500 font-bold"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPin((prev) => prev.slice(0, -1))}
                    className="h-12 rounded-lg bg-red-900 text-white"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setPin((prev) => prev + "0")}
                    className="h-12 rounded-lg bg-gray-800 text-yellow-500 font-bold"
                  >
                    0
                  </button>
                  <button
                    type="submit"
                    disabled={pin.length !== 6}
                    className={`h-12 rounded-lg font-bold ${pin.length === 6
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-700 text-gray-500"
                      }`}
                  >
                    OK
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-center mb-4">{error}</div>
                )}

                <button
                  type="button"
                  onClick={() => setShowTerminal(false)}
                  className="w-full py-2 bg-gray-800 text-gray-400 rounded-lg"
                >
                  CANCEL
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s; }
      `}</style>
    </>
  );
};

export default HiddenAdminAccess;
