import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { AccessPendingPage } from '@/features/auth/AccessPendingPage';
import { TerminalPage } from '@/features/terminal/TerminalPage';
import { InstallGate } from '@/components/InstallGate';
import { useDriverStore } from '@/store/useDriverStore';

/**
 * PRODUCTION APP ARCHITECTURE
 * Implements strict PWA gating and platform-aware routing.
 */
const App: React.FC = () => {
    const { profile } = useAuth();
    const sessionLoading = useDriverStore(state => state.sessionLoading);

    // 🔐 Verification Logic
    const isApproved = profile?.role === 'driver' && (profile?.verified === true || profile?.status === 'approved');
    const isPendingOrRejected = profile && !isApproved;

    // 🛡️ ARCHITECTURAL GATE
    // The InstallGate handles standalone/pwa/mobile enforcement.
    // Children only render if the environment is compliant.
    return (
        <InstallGate>
            {sessionLoading ? (
                <div className="fixed inset-0 bg-[#0A0C14] flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-transparent border-t-[#B9975B] rounded-full animate-spin"></div>
                </div>
            ) : (
                <Router>
                    <Routes>
                        {/* Public Access */}
                        <Route
                            path="/login"
                            element={profile ? <Navigate to="/terminal" replace /> : <LoginPage />}
                        />

                        {/* Verification Guard */}
                        <Route
                            path="/access-pending"
                            element={isPendingOrRejected ? <AccessPendingPage /> : <Navigate to="/" replace />}
                        />

                        {/* Secure Access */}
                        <Route
                            path="/terminal"
                            element={isApproved ? <TerminalPage /> : (isPendingOrRejected ? <Navigate to="/access-pending" replace /> : <Navigate to="/login" replace />)}
                        />

                        {/* Root Redirection */}
                        <Route
                            path="/"
                            element={<Navigate to={isApproved ? "/terminal" : (isPendingOrRejected ? "/access-pending" : "/login")} replace />}
                        />
                    </Routes>
                </Router>
            )}
        </InstallGate>
    );
};

export default App;
