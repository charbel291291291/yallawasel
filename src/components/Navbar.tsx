import React from "react";
import { Link, useLocation } from "react-router-dom";
import { User, AppSettings } from "../types";
import { translations, Language } from "../translations";

interface NavbarProps {
    user: User | null;
    settings: AppSettings;
    cartCount: number;
    lang: Language;
    toggleLanguage: () => void;
    onLogout: () => void;
    onOpenCart: () => void;
    onLogoClick?: () => void;
}

const NavLink = ({
    to,
    label,
    isActive,
}: {
    to: string;
    label: string;
    isActive: boolean;
}) => (
    <Link
        to={to}
        className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all duration-300 uppercase tracking-wider ${isActive
            ? "bg-white text-primary shadow-sm scale-[1.02] border border-gray-100"
            : "text-gray-500 hover:text-gray-900 hover:bg-white/40"
            }`}
    >
        {label}
    </Link>
);

const Navbar: React.FC<NavbarProps> = ({
    user,
    settings,
    cartCount,
    lang,
    toggleLanguage,
    onLogout,
    onOpenCart,
    onLogoClick,
}) => {
    const t = translations[lang];
    const location = useLocation();

    return (
        <header className="absolute top-4 left-4 right-4 z-40 glass-panel rounded-2xl border border-white/40 shadow-2xl py-2 px-4 sm:px-6 animate-3d-entrance">
            <div className="flex justify-between items-center max-w-7xl mx-auto h-14">
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                        onClick={onLogoClick || undefined}
                        data-logo="true"
                    >
                        {settings.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt={settings.store_name}
                                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                Y
                            </div>
                        )}
                        <h1 className="font-luxury text-lg sm:text-xl font-bold text-primary hidden lg:block tracking-tight">
                            {settings.store_name || "YALLA WASEL"}
                        </h1>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 bg-gray-100/30 p-1 rounded-xl border border-gray-200/50 shadow-inner">
                        <NavLink
                            to="/"
                            label={t.home}
                            isActive={location.pathname === "/"}
                        />
                        <NavLink
                            to="/shop"
                            label={t.kits}
                            isActive={location.pathname === "/shop"}
                        />
                        <NavLink
                            to="/impact"
                            label={t.impact}
                            isActive={location.pathname === "/impact"}
                        />
                    </nav>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="hidden sm:flex items-center justify-center h-10 px-3 text-[10px] font-black text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-white hover:shadow-sm"
                    >
                        {lang === "en" ? "عربي" : "ENGLISH"}
                    </button>

                    {/* Cart Trigger */}
                    <button
                        onClick={onOpenCart}
                        className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-800 hover:text-primary transition-colors shadow-sm hover:shadow-md"
                    >
                        <i className="fa-solid fa-bag-shopping"></i>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/profile"
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-md group ${location.pathname === "/profile"
                                    ? "bg-primary text-white scale-110"
                                    : "bg-primary/5 text-primary hover:bg-white"
                                    }`}
                            >
                                <span className="group-hover:scale-110 transition-transform">
                                    {user.name.charAt(0)}
                                </span>
                            </Link>
                            <button
                                onClick={onLogout}
                                className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                                <i className="fa-solid fa-power-off text-sm"></i>
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="btn-3d bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg hidden sm:block uppercase tracking-widest"
                        >
                            {t.signIn}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
