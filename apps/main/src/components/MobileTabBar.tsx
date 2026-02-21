import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Language } from "../translations";

interface MobileTabBarProps {
    lang: Language;
    onOpenCart: () => void;
    cartCount: number;
}

const MobileTab = ({ to, icon, label, isActive }: { to: string; icon: string; label: string; isActive: boolean }) => (
    <Link
        to={to}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-white/20 hover:text-white/40"
            }`}
    >
        <i className={`${isActive ? "fa-solid" : "fa-regular"} ${icon} text-lg`}></i>
        <span
            className={`text-[8px] font-black uppercase tracking-[0.1em] mt-1.5 ${isActive ? "text-primary" : "text-white/10"
                }`}
        >
            {label}
        </span>
    </Link>
);

const MobileTabBar: React.FC<MobileTabBarProps> = ({ lang, onOpenCart, cartCount }) => {
    const isRTL = lang === 'ar';
    const location = useLocation();

    return (
        <div className="fixed bottom-6 left-6 right-6 z-50 animate-entrance">
            <div className="bg-[#151821]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-[80px] flex justify-around items-center px-4 max-w-sm mx-auto">
                <MobileTab
                    to="/"
                    icon="fa-house"
                    label={isRTL ? 'الرئيسية' : 'HOME'}
                    isActive={location.pathname === "/"}
                />
                <MobileTab
                    to="/shop"
                    icon="fa-box"
                    label={isRTL ? 'المتجر' : 'SHOP'}
                    isActive={location.pathname === "/shop"}
                />

                {/* Floating Action Button for Cart */}
                <button
                    onClick={onOpenCart}
                    className="relative w-14 h-14 bg-gold-gradient rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(200,169,81,0.3)] -translate-y-4 active:scale-90 transition-all duration-300"
                >
                    <i className="fa-solid fa-bag-shopping text-xl"></i>
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                            {cartCount}
                        </span>
                    )}
                </button>

                <MobileTab
                    to="/impact"
                    icon="fa-heart"
                    label={isRTL ? 'أثرنا' : 'IMPACT'}
                    isActive={location.pathname === "/impact"}
                />
                <MobileTab
                    to="/profile"
                    icon="fa-user"
                    label={isRTL ? 'حسابي' : 'PROFILE'}
                    isActive={location.pathname === "/profile"}
                />
            </div>
        </div>
    );
};

export default MobileTabBar;
