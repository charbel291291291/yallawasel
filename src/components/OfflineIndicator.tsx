import React, { useState, useEffect } from "react";

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn">
      <i className="fa-solid fa-wifi text-sm"></i>
      <span className="font-bold text-sm">OFFLINE</span>
      <span className="text-xs opacity-80">Limited functionality</span>
    </div>
  );
};

export default OfflineIndicator;
