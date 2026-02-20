
import React from 'react';
import { User, UserTier } from '../types';
import { translations, Language } from '../translations';

interface WalletCardProps {
  user: User;
  lang: Language;
}

const WalletCard: React.FC<WalletCardProps> = ({ user, lang }) => {
  const t = translations[lang];

  // Define tier metadata with specific gradients mimicking metal cards
  const tierConfig = {
    [UserTier.BRONZE]: {
      bg: 'bg-gradient-to-br from-[#8B4513] via-[#CD7F32] to-[#A0522D]',
      text: 'text-white',
      shadow: 'shadow-orange-900/40',
      sheen: 'after:bg-gradient-to-tr after:from-white/10 after:to-transparent'
    },
    [UserTier.SILVER]: {
      bg: 'bg-gradient-to-br from-[#757575] via-[#C0C0C0] to-[#E0E0E0]',
      text: 'text-gray-900',
      shadow: 'shadow-gray-500/40',
      sheen: 'after:bg-gradient-to-tr after:from-white/40 after:to-transparent'
    },
    [UserTier.GOLD]: {
      bg: 'bg-gradient-to-br from-[#DAA520] via-[#FFD700] to-[#B8860B]',
      text: 'text-yellow-900',
      shadow: 'shadow-yellow-600/40',
      sheen: 'after:bg-gradient-to-tr after:from-white/30 after:to-transparent'
    },
    [UserTier.ELITE]: {
      bg: 'bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-black',
      text: 'text-white',
      shadow: 'shadow-black/60',
      sheen: 'after:bg-gradient-to-tr after:from-white/10 after:to-transparent'
    }
  };

  const config = tierConfig[user.tier] || tierConfig[UserTier.BRONZE];
  
  // Format points visually like a card number
  const rawPoints = user.points.toString().padStart(8, '0'); // Ensure at least 8 digits
  const formattedPoints = rawPoints.replace(/(.{4})/g, '$1 ').trim(); 

  return (
    <div className="w-full flex justify-center py-4">
      <div className={`relative w-full max-w-[320px] aspect-[1.586/1] rounded-xl transition-all duration-500 hover:scale-105 hover:rotate-1 shadow-2xl ${config.shadow} ${config.bg} overflow-hidden group`}>
        
        {/* Holographic / Shine Effects */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none"></div>
        <div className={`absolute -right-12 -top-12 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:animate-pulse`}></div>

        {/* Card Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5 select-none">
          
          {/* Header: Chip & WiFi */}
          <div className="flex justify-between items-start">
             {/* EMV Chip Simulation */}
             <div className="w-11 h-9 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/30 shadow-inner relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-700/40"></div>
                <div className="absolute top-0 left-1/3 w-[1px] h-full bg-yellow-700/40"></div>
                <div className="absolute top-0 right-1/3 w-[1px] h-full bg-yellow-700/40"></div>
                <div className="absolute top-1/2 left-1/2 w-4 h-3 border border-yellow-700/40 rounded-[2px] transform -translate-x-1/2 -translate-y-1/2"></div>
             </div>
             
             {/* Contactless Symbol */}
             <div className={`flex flex-col items-end opacity-80 ${config.text}`}>
               <i className="fa-solid fa-wifi rotate-90 text-2xl"></i>
             </div>
          </div>

          {/* Middle: Points (Card Number) */}
          <div className="mt-2 pl-1">
             <div className={`flex items-center gap-4 font-mono text-xl sm:text-2xl tracking-widest font-bold drop-shadow-md ${config.text}`} style={{textShadow: '1px 1px 2px rgba(0,0,0,0.3)'}}>
               {formattedPoints}
             </div>
             <p className={`text-[8px] uppercase tracking-[0.2em] opacity-70 mt-1 ${config.text}`}>
               {t.pointsBalance || 'PTS BALANCE'}
             </p>
          </div>

          {/* Footer: Name, Expiry, Logo */}
          <div className="flex justify-between items-end">
             {/* Name & Valid Thru */}
             <div className="flex flex-col gap-1">
                <div className="flex items-end gap-2">
                   <div className="flex flex-col">
                      <span className={`text-[6px] uppercase opacity-70 ${config.text}`}>VALID THRU</span>
                      <span className={`font-mono text-xs font-bold ${config.text}`}>12/99</span>
                   </div>
                </div>
                <p className={`font-medium uppercase tracking-wider text-sm truncate max-w-[160px] drop-shadow-sm ${config.text}`}>
                  {user.name || 'VALUED MEMBER'}
                </p>
             </div>
             
             {/* Visa-style Brand Mark */}
             <div className="flex flex-col items-end">
               <h2 className={`italic font-serif font-black text-2xl tracking-tighter leading-none ${config.text} opacity-90`}>
                 {user.tier.toUpperCase()}
               </h2>
               <span className={`text-[7px] uppercase font-bold tracking-widest ${config.text} opacity-75`}>
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
