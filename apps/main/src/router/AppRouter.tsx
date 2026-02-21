import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import("@/pages/HomePage"));
const ShopPage = React.lazy(() => import("@/pages/ShopPage"));
const ImpactPage = React.lazy(() => import("@/pages/ImpactPage"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const LoginPage = React.lazy(() => import("@/components/LoginPage"));
const AdminPanel = React.lazy(() => import("@/components/AdminPanel"));
const OrderTrackingPage = React.lazy(() => import("@/components/OrderTrackingPage"));
const FleetDashboard = React.lazy(() => import("@/features/fleet/pages/FleetDashboard"));

const PageSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Security Terminal...</p>
        </div>
    </div>
);

const AppRouter: React.FC = () => {
    const { user } = useAuth();
    const { lang } = useStore();


    return (
        <Suspense fallback={<PageSpinner />}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ErrorBoundary>
                            <HomePage />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/shop"
                    element={
                        <ErrorBoundary>
                            <ShopPage />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/impact"
                    element={
                        <ErrorBoundary>
                            <ImpactPage />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ErrorBoundary>
                                <ProfilePage />
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
                <Route
                    path="/fleet"
                    element={
                        <ProtectedRoute fleetOnly={true}>
                            <ErrorBoundary>
                                <FleetDashboard />
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace={true} />} />
            </Routes>
        </Suspense>
    );
};


export default AppRouter;
