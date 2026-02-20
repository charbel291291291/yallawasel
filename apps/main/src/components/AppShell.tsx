import React, { useState, useEffect, useCallback, startTransition } from "react";
import { useLocation } from "react-router-dom";
import {
    CartItem,
    Product,
} from "@/types";
import { Language } from "@/translations";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useCheckout } from "@/hooks/useCheckout";

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
    const [cart, setCart] = useState<CartItem[]>([]);
    const [lang, setLang] = useState<Language>("en");
    const [isCartOpen, setIsCartOpen] = useState(false);

    const { settings } = useSettings();
    const location = useLocation();
    const { user, handleLogout, authLoading } = useAuth();
    const { products, happyHours } = useProducts();
    const { setUser } = useAuth(); // for checkout updates

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

    const toggleLanguage = useCallback(() => {
        startTransition(() => {
            setLang((prev: Language) => (prev === "en" ? "ar" : "en"));
        });
    }, []);

    const addToCart = useCallback((product: Product) => {
        startTransition(() => {
            setCart((prev: CartItem[]) => {
                const existing = prev.find((p) => p.id === product.id);
                if (existing)
                    return prev.map((p) =>
                        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
                    );
                return [...prev, { ...product, quantity: 1 }];
            });
        });
        // Use a small delay for smoother UI feedback
        setTimeout(() => setIsCartOpen(true), 50);
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
                    products={products}
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
