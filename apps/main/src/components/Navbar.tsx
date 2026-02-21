import React from "react";
import { Link } from "react-router-dom";
import { User, AppSettings } from "../types";
import { Language } from "../translations";

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

const Navbar: React.FC<NavbarProps> = ({
    user,
    settings,
    cartCount,
    lang,
    toggleLanguage,
    onOpenCart,
    onLogoClick,
}) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-6 px-6 sm:px-12 animate-entrance">
            <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
                {/* Logo Section */}
                <Link
                    to="/"
                    className="flex items-center gap-4 group"
                    onClick={onLogoClick || undefined}
                >
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-primary/50 transition-all duration-500 shadow-2xl relative">
                        <div className="absolute inset-0 bg-primary/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img
                            src={settings.logo_url || "/icons/favicon.png"}
                            alt="Logo"
                            className="w-7 h-7 object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    {/* Language Switcher Pill */}
                    <button
                        onClick={toggleLanguage}
                        className="h-10 px-5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 uppercase"
                    >
                        {lang === "en" ? "AR" : "EN"}
                    </button>

                    {/* Minimal Cart */}
                    <button
                        onClick={onOpenCart}
                        className="relative w-10 h-10 flex items-center justify-center text-white/60 hover:text-primary transition-colors"
                    >
                        <i className="fa-solid fa-bag-shopping"></i>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(200,169,81,0.5)]"></span>
                        )}
                    </button>

                    {/* Profile / Auth */}
                    {user ? (
                        <Link
                            to="/profile"
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 transition-all"
                        >
                            <span className="text-xs font-black uppercase">{user.name?.charAt(0)}</span>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="hidden sm:flex text-[9px] font-black tracking-[0.2em] text-white/20 hover:text-primary transition-colors uppercase py-2"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
