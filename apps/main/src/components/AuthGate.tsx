import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';


interface AuthGateProps {
    children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
    const { authLoading, user } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // If offline and we have a cached user, allow them through
    // If online, wait for authLoading to finish
    if (authLoading && isOnline) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">Verifying Identity...</p>
            </div>
        );
    }

    // Offline Fallback Screen if not even basic layout is ready
    if (!isOnline && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6">
                    <i className="fas fa-wifi-slash text-primary text-3xl"></i>
                </div>
                <h1 className="text-white text-2xl font-bold mb-2">Connection Issue</h1>
                <p className="text-gray-400 text-sm max-w-xs mb-8">
                    You're currently offline. Please check your internet connection to access Yalla Wasel services.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/80 transition-all"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return <>{children}</>;
};
