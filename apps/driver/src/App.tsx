import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';
import { LoginPage } from './features/auth/LoginPage';
import { AccessPendingPage } from './features/auth/AccessPendingPage';
import { TerminalPage } from './features/terminal/TerminalPage';
import { LoadingScreen } from './components/LoadingScreen';
import { useDriverStore } from './store/useDriverStore';

const App: React.FC = () => {
    const { profile } = useAuth();
    const sessionLoading = useDriverStore(state => state.sessionLoading);


    // 🔐 Verification Logic
    // If we have a profile, we allow access for now or redirect to pending
    // Note: In production, this should be strict.
    const isApproved = profile?.role === 'driver' && (profile?.verified === true || profile?.status === 'approved');

    // If they have a profile but aren't approved yet, we show pending
    // We treat 'pending' or null status as "not yet approved"
    const isPendingOrRejected = profile && !isApproved;

    // 🔐 Session Hydration Guard
    if (sessionLoading) {
        return <LoadingScreen message="Establishing Satellite Uplink" />;
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
