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
  speed?: number; // Duration in seconds for full loop
}

const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  happyHours,
  lang = "en",
  speed = 40,
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
  const hasHappyHours = activeHappyHours && activeHappyHours.length > 0;

  // Use first active happy hour for display, or cycle if implemented
  const currentHappyHour = hasHappyHours
    ? activeHappyHours[currentMessageIndex]
    : null;

  return (
    <div className="relative z-50 overflow-hidden bg-slate-900 border-b border-white/10 shadow-lg h-12 flex items-center">
      {/* Left Badge */}
      <div className="flex-shrink-0 h-full bg-red-600 px-6 flex items-center justify-center relative z-20 shadow-xl group cursor-pointer hover:bg-red-700 transition-colors">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {hasHappyHours && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${hasHappyHours ? "bg-white" : "bg-white/50"}`}></span>
          </span>
          <span className="font-black text-xs uppercase tracking-widest text-white">
            {lang === 'ar' ? 'عاجل' : 'LIVE OFFER'}
          </span>
        </div>
        {/* Arrow decor */}
        <div className="absolute top-0 right-0 translate-x-1/2 w-4 h-full bg-red-600 transform skew-x-12 z-10 hidden md:block"></div>
      </div>

      {/* Scrolling Content */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center pl-8 md:pl-12">
        {hasHappyHours ? (
          <div
            className="animate-marquee whitespace-nowrap flex items-center gap-12 font-bold text-sm tracking-wide text-white"
            style={{ animationDuration: `${speed}s` }}
          >
            {/* Repeat content for smooth loop */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-yellow-400 font-luxury italic text-lg">{currentHappyHour?.name}</span>
                <span className="text-white/40">|</span>
                <span className="text-green-400 font-black">{currentHappyHour?.multiplier}X POINTS</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">LIMITED TIME</span>
                {currentHappyHour?.bonus_points > 0 && (
                  <>
                    <span className="text-white/40">+</span>
                    <span className="text-blue-300 font-bold">{currentHappyHour?.bonus_points} BONUS</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-widest">
            <i className="fa-solid fa-star text-slate-800"></i>
            <span>{lang === 'ar' ? 'ترقبوا العروض القادمة' : 'Stay tuned for exclusive offers'}</span>
          </div>
        )}

        {/* Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
