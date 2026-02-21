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
  const isRTL = lang === "ar";
  const activeHappyHours = happyHours?.filter((hh) => hh.active) || [];

  useEffect(() => {
    if (activeHappyHours.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) =>
        prev >= activeHappyHours.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [activeHappyHours.length]);

  const hasHappyHours = activeHappyHours && activeHappyHours.length > 0;
  const currentHappyHour = hasHappyHours ? activeHappyHours[currentMessageIndex] : null;

  return (
    <div className={`relative z-50 overflow-hidden bg-black/60 backdrop-blur-xl border-b border-white/5 h-10 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Primary Badge */}
      <div className={`flex-shrink-0 h-full bg-gold-gradient px-4 flex items-center justify-center relative z-20 shadow-2xl group cursor-pointer overflow-hidden`}>
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
        <div className="flex items-center gap-2 relative z-10">
          <span className="relative flex h-2 w-2">
            {hasHappyHours && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hasHappyHours ? "bg-black" : "bg-black/20"}`}></span>
          </span>
          <span className="font-black text-[9px] uppercase tracking-[0.2em] text-black">
            {isRTL ? 'عرض مباشر' : 'LIMITED ACCESS'}
          </span>
        </div>
      </div>

      {/* Scrolling Content */}
      <div className={`flex-1 overflow-hidden relative h-full flex items-center ${isRTL ? 'pr-8' : 'pl-8'}`}>
        {hasHappyHours ? (
          <div
            className="animate-marquee whitespace-nowrap flex items-center gap-20 font-black text-[10px] tracking-widest text-white/60"
            style={{ animationDuration: `${speed}s` }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-primary font-luxury italic text-sm normal-case tracking-tight">{currentHappyHour?.name}</span>
                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                <span className="text-white font-black">{currentHappyHour?.multiplier}X PRESTIGE MULTIPLIER</span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/20 rounded text-[8px] font-black">ACTIVE</span>
                {(currentHappyHour?.bonus_points ?? 0) > 0 && (
                  <>
                    <span className="text-white/20">+</span>
                    <span className="text-white font-black">{currentHappyHour?.bonus_points} REWARD TOKENS</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
            <i className="fa-solid fa-crown text-[8px]"></i>
            <span>{isRTL ? 'ترقبوا الخدمات الحصرية' : 'Exclusive experiences incoming'}</span>
          </div>
        )}

        {/* Cinematic Fades */}
        <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 opacity-50`}></div>
        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 opacity-50`}></div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
