import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Product, AppSettings } from "@/types";
import { Language } from "@/translations";
import ProtectedRoute from "./ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import("@/pages/HomePage"));
const ShopPage = React.lazy(() => import("@/pages/ShopPage"));
const ImpactPage = React.lazy(() => import("@/pages/ImpactPage"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const LoginPage = React.lazy(() => import("@/components/LoginPage"));
const AdminPanel = React.lazy(() => import("@/components/AdminPanel"));
const OrderTrackingPage = React.lazy(() => import("@/components/OrderTrackingPage"));

const PageSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Security Terminal...</p>
        </div>
    </div>
);

import { useStore } from "@/store/useStore";

interface AppRouterProps {
    addToCart: (p: Product) => void;
    lang: Language;
    settings: AppSettings;
}

const AppRouter: React.FC<AppRouterProps> = ({
    addToCart,
    lang,
    settings,
}) => {
    const { user, handleLogout } = useAuth();
    const products = useStore((state) => state.products);

    return (
        <Suspense fallback={<PageSpinner />}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ErrorBoundary>
                            <HomePage
                                products={products}
                                addToCart={addToCart}
                                lang={lang}
                                settings={settings}
                            />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/shop"
                    element={
                        <ErrorBoundary>
                            <ShopPage
                                products={products}
                                addToCart={addToCart}
                                lang={lang}
                                settings={settings}
                            />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/impact"
                    element={
                        <ErrorBoundary>
                            <ImpactPage lang={lang} settings={settings} user={user} />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ErrorBoundary>
                                <ProfilePage
                                    user={user!}
                                    lang={lang}
                                    onLogout={handleLogout}
                                />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <ErrorBoundary>
                            <AdminPanel />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <ErrorBoundary>
                            {user ? <Navigate to="/profile" replace={true} /> : <LoginPage lang={lang} />}
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/order/:id"
                    element={
                        <ErrorBoundary>
                            <OrderTrackingPage lang={lang} />
                        </ErrorBoundary>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace={true} />} />
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
