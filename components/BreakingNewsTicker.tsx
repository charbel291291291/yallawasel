import React, { useState, useEffect } from "react";

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

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-3 breaking-news-3d">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>

      <div className="relative z-10 flex items-center">
        {/* Happy Hours Badge - Larger and more visible */}
        <div className="flex items-center px-4 bg-yellow-400 text-red-800 font-black text-sm px-4 py-2 rounded-r-xl shadow-lg">
          <i className="fas fa-gift mr-2 text-lg"></i>
          <span className="uppercase tracking-wider">Happy Hours</span>
        </div>

        {/* Message - Larger, bolder text with shadow */}
        <div className="flex animate-marquee whitespace-nowrap ml-4">
          <p className="font-black text-base md:text-lg tracking-wide text-white drop-shadow-md">
            <span className="text-yellow-300">{currentHappyHour.name}</span>
            <span className="mx-2">•</span>
            <span className="text-yellow-300">
              {currentHappyHour.multiplier}x
            </span>{" "}
            POINTS
            <span className="mx-2">•</span>
            <span className="text-green-300">
              +{currentHappyHour.bonus_points}
            </span>{" "}
            BONUS!
          </p>
        </div>

        <div className="flex animate-marquee whitespace-nowrap ml-4">
          <p className="font-black text-base md:text-lg tracking-wide text-white drop-shadow-md">
            <span className="text-yellow-300">{currentHappyHour.name}</span>
            <span className="mx-2">•</span>
            <span className="text-yellow-300">
              {currentHappyHour.multiplier}x
            </span>{" "}
            POINTS
            <span className="mx-2">•</span>
            <span className="text-green-300">
              +{currentHappyHour.bonus_points}
            </span>{" "}
            BONUS!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
