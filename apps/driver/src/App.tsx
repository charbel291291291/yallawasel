import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';
import { LoginPage } from './features/auth/LoginPage';
import { AccessPendingPage } from './features/auth/AccessPendingPage';
import { TerminalPage } from './features/terminal/TerminalPage';
import { InstallLanding } from './components/InstallLanding';
import { useDriverStore } from './store/useDriverStore';

const App: React.FC = () => {
    const { profile } = useAuth();
    const sessionLoading = useDriverStore(state => state.sessionLoading);
    const [showLanding, setShowLanding] = useState(true);

    // 🔐 Verification Logic
    const isApproved = profile?.role === 'driver' && (profile?.verified === true || profile?.status === 'approved');
    const isPendingOrRejected = profile && !isApproved;

    // Handle Landing Visibility
    // We show landing while session is loading, or for a minimum duration to ensure the premium experience
    useEffect(() => {
        if (!sessionLoading) {
            // Give extra time for smooth transition
            const timer = setTimeout(() => {
                setShowLanding(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sessionLoading]);

    if (showLanding) {
        return <InstallLanding onComplete={() => setShowLanding(false)} />;
    }

    return (
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
    );
};

export default App;
