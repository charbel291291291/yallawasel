import React, { useState, useEffect, useCallback, startTransition } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckout } from "@/hooks/useCheckout";
import { useStore, setupRealtimeListeners } from "@/store/useStore";

// Components
import Navbar from "@/components/Navbar";

import MobileTabBar from "@/components/MobileTabBar";
import CartDrawer from "@/components/CartDrawer";
import OrderSuccessModal from "@/components/OrderSuccessModal";
import HiddenAdminAccess from "@/components/HiddenAdminAccess";
import BreakingNewsTicker from "@/components/BreakingNewsTicker";
import OfflineIndicator from "@/components/OfflineIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppRouter from "@/router/AppRouter";


const AppShell: React.FC = () => {
    const {
        cart,
        lang,
        user,
        setLang,
        fetchInitialData
    } = useStore();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const { settings } = useSettings();
    const location = useLocation();
    const { handleLogout, authLoading } = useAuth();
    const happyHours = useStore(s => s.happyHours);

    const {
        checkoutLoading,
        lastOrder,
        showOrderSuccess,
        handleCheckout,
        closeOrderSuccess,
    } = useCheckout(setIsCartOpen, settings);


    useEffect(() => {
        // Initialize store data - real-time pipeline disabled for stability
        fetchInitialData();
        // const cleanup = setupRealtimeListeners();
        // return cleanup;
    }, [fetchInitialData]);

    const toggleLanguage = useCallback(() => {
        startTransition(() => {
            setLang(lang === "en" ? "ar" : "en");
        });
    }, [lang, setLang]);

    const isAdminRoute = location.pathname.startsWith("/admin");

    if (authLoading && !isAdminRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary/20 border-t-primary"></div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-colors duration-500 pb-24 sm:pb-0 ${isAdminRoute ? "bg-slate-50" : "pt-24 bg-white"
                }`}
        >
            {!isAdminRoute && (
                <ErrorBoundary>
                    <HiddenAdminAccess>
                        <Navbar
                            user={user}
                            settings={settings}
                            cartCount={cart.length}
                            lang={lang}
                            toggleLanguage={toggleLanguage}
                            onLogout={handleLogout}
                            onOpenCart={() => setIsCartOpen(true)}
                        />
                        <BreakingNewsTicker happyHours={happyHours} lang={lang} speed={settings.ticker_speed} />
                    </HiddenAdminAccess>
                </ErrorBoundary>
            )}

            <main className={isAdminRoute ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
                <AppRouter />
            </main>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onCheckout={handleCheckout}
                checkoutLoading={checkoutLoading}
            />


            {showOrderSuccess && lastOrder && (
                <OrderSuccessModal
                    lastOrder={lastOrder}
                    lang={lang}
                    onClose={closeOrderSuccess}
                />
            )}

            {!isAdminRoute && (
                <MobileTabBar
                    lang={lang}
                    onOpenCart={() => setIsCartOpen(true)}
                    cartCount={cart.length}
                />
            )}

            <OfflineIndicator />
        </div>
    );
};


export default AppShell;
