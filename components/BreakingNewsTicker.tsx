import React, { useState, useEffect, useMemo } from "react";

interface BreakingNewsTickerProps {
  happyHours:
    | Array<{
        id: string;
        name: string;
        start_time: string;
        end_time: string;
        multiplier: number;
        bonus_points: number;
        active: boolean;
      }>
    | undefined;
}

const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  happyHours,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Filter active happy hours, with safe handling for undefined
  const activeHappyHours = happyHours?.filter((hh) => hh.active) || [];

  useEffect(() => {
    if (activeHappyHours.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) =>
        prev >= activeHappyHours.length - 1 ? 0 : prev + 1
      );
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, [activeHappyHours.length]);

  if (activeHappyHours.length === 0) return null;

  const currentHappyHour = activeHappyHours[currentMessageIndex];

  // Memoize message creation to avoid recalculating on every render
  const message = useMemo(
    () =>
      `${currentHappyHour.name} - ${currentHappyHour.multiplier}x POINTS & +${currentHappyHour.bonus_points} BONUS POINTS!`,
    [currentHappyHour]
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-2 breaking-news-3d">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>

      <div className="relative z-10 flex items-center">
        <div className="animate-pulse flex items-center px-4">
          <span className="bg-yellow-400 text-red-800 font-black text-xs px-2 py-1 rounded mr-3 uppercase tracking-wider pulse-glow">
            Happy Hours
          </span>
          <i className="fas fa-gift text-yellow-300 mr-3"></i>
        </div>

        <div className="flex animate-marquee whitespace-nowrap">
          <p className="font-bold text-sm tracking-wide breaking-news-glow">
            {message}
          </p>
        </div>

        <div className="flex animate-marquee whitespace-nowrap ml-4">
          <p className="font-bold text-sm tracking-wide breaking-news-glow">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
