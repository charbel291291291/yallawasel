import React, { useState, useEffect } from "react";

interface BreakingNewsTickerProps {
  happyHours?:
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
  lang?: "en" | "ar";
}

const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  happyHours,
  lang = "en",
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

  // ALWAYS RENDER - Never return null
  // If no happy hours, show placeholder message
  const hasHappyHours = activeHappyHours.length > 0;
  const currentHappyHour = hasHappyHours
    ? activeHappyHours[currentMessageIndex]
    : null;

  return (
    <div
      className={`relative overflow-hidden py-3 breaking-news-3d ${
        hasHappyHours
          ? "bg-gradient-to-r from-red-600 via-red-700 to-red-800"
          : "bg-gray-100 border-b border-gray-200"
      } text-white`}
    >
      {/* Animated background elements - only when has happy hours */}
      {hasHappyHours && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>
      )}

      <div className="relative z-10 flex items-center">
        {/* Happy Hours Badge - Larger and more visible */}
        <div
          className={`flex items-center px-4 font-black text-sm py-2 rounded-r-xl shadow-lg ${
            hasHappyHours
              ? "bg-yellow-400 text-red-800"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          <i
            className={`fas mr-2 text-lg ${
              hasHappyHours ? "fa-gift" : "fa-clock"
            }`}
          ></i>
          <span className="uppercase tracking-wider">
            {lang === "ar" ? "ساعات سعيدة" : "Happy Hours"}
          </span>
        </div>

        {/* Message - Larger, bolder text with shadow */}
        {hasHappyHours ? (
          <>
            <div className="flex animate-marquee whitespace-nowrap ml-4">
              <p className="font-black text-base md:text-lg tracking-wide text-white drop-shadow-md">
                <span className="text-yellow-300">
                  {currentHappyHour?.name}
                </span>
                <span className="mx-2">•</span>
                <span className="text-yellow-300">
                  {currentHappyHour?.multiplier}x
                </span>{" "}
                POINTS
                <span className="mx-2">•</span>
                <span className="text-green-300">
                  +{currentHappyHour?.bonus_points}
                </span>{" "}
                BONUS!
              </p>
            </div>
            <div className="flex animate-marquee whitespace-nowrap ml-4">
              <p className="font-black text-base md:text-lg tracking-wide text-white drop-shadow-md">
                <span className="text-yellow-300">
                  {currentHappyHour?.name}
                </span>
                <span className="mx-2">•</span>
                <span className="text-yellow-300">
                  {currentHappyHour?.multiplier}x
                </span>{" "}
                POINTS
                <span className="mx-2">•</span>
                <span className="text-green-300">
                  +{currentHappyHour?.bonus_points}
                </span>{" "}
                BONUS!
              </p>
            </div>
          </>
        ) : (
          // Empty state - always shows something
          <div className="flex ml-4">
            <p className="text-sm text-gray-500 font-medium">
              {lang === "ar"
                ? "لا توجد عروض نشطة حالياً - تابعنا للحصول على العروض الجديدة"
                : "No active offers - Follow us for new deals!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
