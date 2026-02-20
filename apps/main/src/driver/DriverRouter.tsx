import { useContext, ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { DriverAuthProvider } from "@/driver/context/DriverAuthContext";
import DriverAuthContext from "@/driver/context/DriverAuthContext";
import DriverLogin from "@/driver/pages/DriverLogin";
import DriverDashboard from "@/driver/pages/DriverDashboard";
import DriverProfile from "@/driver/pages/DriverProfile";
import DriverWallet from "@/driver/pages/DriverWallet";
import DriverBottomNav from "@/driver/components/DriverBottomNav";

// ---------- Route Guards ----------

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
    </div>
);

const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { session, loading } = useContext(DriverAuthContext);
    if (loading) return <LoadingScreen />;
    if (session) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { session, loading } = useContext(DriverAuthContext);
    if (loading) return <LoadingScreen />;
    if (!session) return <Navigate to="/" replace />;
    return (
        <>
            {children}
            <DriverBottomNav />
        </>
    );
};

// ---------- App Router ----------

const DriverRouter = () => (
    <HashRouter>
        <DriverAuthProvider>
            <Routes>
                <Route path="/" element={<PublicRoute><DriverLogin /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><DriverProfile /></ProtectedRoute>} />
                <Route path="/earnings" element={<ProtectedRoute><DriverWallet /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </DriverAuthProvider>
    </HashRouter>
);

export default DriverRouter;
