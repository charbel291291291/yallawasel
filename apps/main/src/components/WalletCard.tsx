
import React from 'react';
import { User, UserTier } from '@/types';
import { Language } from '@/utils/translations';

interface WalletCardProps {
  user: User;
  lang: Language;
}

const WalletCard: React.FC<WalletCardProps> = ({ user, lang }) => {
  const isRTL = lang === 'ar';

  const tierConfig = {
    [UserTier.BRONZE]: {
      bg: 'bg-gradient-to-br from-[#1c1c1c] via-[#2d2d2d] to-[#1c1c1c]',
      text: 'text-white/80',
      accent: 'text-primary',
      border: 'border-white/5',
      shadow: 'shadow-black/40',
    },
    [UserTier.SILVER]: {
      bg: 'bg-gradient-to-br from-[#d1d1d1] via-[#ffffff] to-[#d1d1d1]',
      text: 'text-gray-900',
      accent: 'text-gray-600',
      border: 'border-white/20',
      shadow: 'shadow-gray-400/20',
    },
    [UserTier.GOLD]: {
      bg: 'bg-gradient-to-br from-[#B8860B] via-[#E0B84F] to-[#C8A951]',
      text: 'text-black',
      accent: 'text-black/60',
      border: 'border-[#C8A951]/20',
      shadow: 'shadow-[#C8A951]/20',
    },
    [UserTier.ELITE]: {
      bg: 'bg-gradient-to-br from-black via-[#0B0E17] to-black',
      text: 'text-white',
      accent: 'text-primary',
      border: 'border-primary/20',
      shadow: 'shadow-[0_0_50px_rgba(200,169,81,0.2)]',
    }
  };

  const config = tierConfig[user.tier] || tierConfig[UserTier.BRONZE];

  const rawPoints = user.points.toString().padStart(8, '0');
  const formattedPoints = rawPoints.replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="w-full flex justify-center py-4">
      <div className={`relative w-full max-w-[380px] aspect-[1.586/1] rounded-[2rem] transition-all duration-700 hover:scale-[1.02] ${config.shadow} ${config.bg} border ${config.border} overflow-hidden group`}>

        {/* Reflection / Grain Effect */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 via-transparent to-black/20 pointer-events-none"></div>
        <div className="absolute -inset-x-full top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] ease-in-out pointer-events-none"></div>

        <div className="relative z-10 h-full flex flex-col justify-between p-8 select-none">

          <div className="flex justify-between items-start">
            {/* Luxury Chip */}
            <div className="w-12 h-10 bg-gradient-to-br from-primary/80 to-primary rounded-lg border border-primary/20 shadow-xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
              <div className="w-8 h-6 border-[0.5px] border-black/10 rounded-sm"></div>
            </div>

            <div className={`flex flex-col items-end ${config.text}`}>
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-black tracking-[0.3em] opacity-40 uppercase">Safe Pay</span>
                <i className="fa-solid fa-wifi rotate-90 text-sm opacity-30"></i>
              </div>
            </div>
          </div>

          <div>
            <div className={`flex items-center gap-6 font-mono text-2xl sm:text-3xl tracking-widest font-black drop-shadow-2xl ${config.text}`}>
              {formattedPoints}
            </div>
            <p className={`text-[8px] font-black uppercase tracking-[0.5em] mt-2 opacity-30 ${config.text}`}>
              {isRTL ? 'رصيد النقاط' : 'ARTIFACT REWARDS'}
            </p>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1.5 text-left" dir="ltr">
              <div className="flex flex-col">
                <span className={`text-[6px] font-black uppercase tracking-widest opacity-30 ${config.text}`}>VALID THRU</span>
                <span className={`font-mono text-xs font-black ${config.text}`}>UNLIMITED</span>
              </div>
              <p className={`font-luxury uppercase tracking-wider text-sm truncate max-w-[200px] ${config.text}`}>
                {user.name || 'VALUED MEMBER'}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <h2 className={`font-luxury font-black text-2xl tracking-tighter leading-none ${config.accent}`}>
                {user.tier.toUpperCase()}
              </h2>
              <span className={`text-[7px] font-black tracking-[0.4em] mt-2 ${config.text} opacity-20`}>
                YALLA WASEL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
