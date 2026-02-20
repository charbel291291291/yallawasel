import React, { useState, useEffect, useCallback, startTransition } from "react";
import { useLocation } from "react-router-dom";
import {
    CartItem,
    Product,
} from "@/types";
import { Language } from "@/translations";
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
import { telemetry } from "@/services/telemetry";

const AppShell: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [lang, setLang] = useState<Language>("en");
    const [isCartOpen, setIsCartOpen] = useState(false);

    const { settings } = useSettings();
    const location = useLocation();
    const { user, handleLogout, authLoading } = useAuth();
    const { setUser } = useAuth(); // for checkout updates

    const happyHours = useStore(s => s.happyHours);
    const fetchInitialData = useStore(s => s.fetchInitialData);

    const {
        checkoutLoading,
        lastOrder,
        showOrderSuccess,
        handleCheckout,
        closeOrderSuccess,
    } = useCheckout(user, setUser, cart, setCart, setIsCartOpen, settings);

    useEffect(() => {
        document.body.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    }, [lang]);

    useEffect(() => {
        // Initialize store data
        fetchInitialData();

        // Setup real-time pipeline
        const cleanup = setupRealtimeListeners();
        return cleanup;
    }, [fetchInitialData]);

    const toggleLanguage = useCallback(() => {
        startTransition(() => {
            setLang((prev: Language) => (prev === "en" ? "ar" : "en"));
        });
    }, []);

    const addToCart = useCallback((product: Product) => {
        const startTime = performance.now();

        // Priority 1: Instant feedback (Open Cart)
        setIsCartOpen(true);

        // Priority 2: Deferred state update
        startTransition(() => {
            setCart((prev: CartItem[]) => {
                const existingIndex = prev.findIndex((p) => p.id === product.id);
                if (existingIndex > -1) {
                    const next = [...prev];
                    next[existingIndex] = {
                        ...next[existingIndex],
                        quantity: next[existingIndex].quantity + 1
                    };
                    return next;
                }
                return [...prev, { ...product, quantity: 1 }];
            });
        });

        telemetry.logInteraction('addToCart', performance.now() - startTime);
    }, []);

    const isAdminRoute = location.pathname.startsWith("/admin");

    if (authLoading && !isAdminRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                <AppRouter
                    addToCart={addToCart}
                    lang={lang}
                    settings={settings}
                />
            </main>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                setCart={setCart}
                lang={lang}
                user={user}
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
