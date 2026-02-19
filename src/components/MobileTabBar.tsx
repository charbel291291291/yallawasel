import React from "react";
import { Link, useLocation } from "react-router-dom";
import { translations, Language } from "../translations";

interface MobileTabBarProps {
    lang: Language;
    onOpenCart: () => void;
    cartCount: number;
}

const MobileTab = ({ to, icon, iconOutline, label, isActive }: { to: string; icon: string; iconOutline: string; label: string; isActive: boolean }) => (
    <Link
        to={to}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${isActive ? "text-red-600 scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
    >
        <i
            className={`${isActive ? "fa-solid" : "fa-regular"} ${isActive ? icon : iconOutline || icon
                } text-xl`}
        ></i>
        <span
            className={`text-[10px] font-medium mt-1 ${isActive ? "text-red-600" : "text-gray-400"
                }`}
        >
            {label}
        </span>
    </Link>
);

const MobileTabBar: React.FC<MobileTabBarProps> = ({ lang, onOpenCart, cartCount }) => {
    const t = translations[lang];
    const location = useLocation();
    return (
        <div
            className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border-t border-gray-100/50"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="flex justify-around items-center h-[70px] px-2 max-w-lg mx-auto">
                <MobileTab
                    to="/"
                    icon="fa-house"
                    iconOutline="fa-house"
                    label={t.home}
                    isActive={location.pathname === "/"}
                />
                <MobileTab
                    to="/shop"
                    icon="fa-box-open"
                    iconOutline="fa-box"
                    label={t.kits}
                    isActive={location.pathname === "/shop"}
                />
                <MobileTab
                    to="/impact"
                    icon="fa-hand-holding-heart"
                    iconOutline="fa-heart"
                    label={t.impact}
                    isActive={location.pathname === "/impact"}
                />

                {/* Cart Tab */}
                <button
                    onClick={onOpenCart}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all relative ${location.pathname === "/cart" || cartCount > 0
                        ? "text-red-600 scale-105"
                        : "text-gray-400"
                        }`}
                >
                    <div className="relative">
                        <i className="fa-regular fa-bag-shopping text-xl"></i>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium mt-1">{t.bag}</span>
                </button>

                <MobileTab
                    to="/profile"
                    icon="fa-user-circle"
                    iconOutline="fa-user"
                    label={t.wallet}
                    isActive={location.pathname === "/profile"}
                />
            </div>
        </div>
    );
};

export default MobileTabBar;
