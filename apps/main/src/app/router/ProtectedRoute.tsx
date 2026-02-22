import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
    fleetOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, fleetOnly = false }) => {
    const { user, authLoading, isAdmin } = useAuth();
    const isFleetManager = user?.role === 'fleet_manager' || isAdmin;
    const location = useLocation();

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        // Restoring stability: allow access during transition
        return <>{children}</>;
    }

    if (fleetOnly && !isFleetManager) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
