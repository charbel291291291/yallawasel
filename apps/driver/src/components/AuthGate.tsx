import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { useDriverStore } from '../store/useDriverStore';

interface AuthGateProps {
    children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
    const { profile } = useAuth();
    const sessionLoading = useDriverStore(state => state.sessionLoading);
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

    if (sessionLoading && isOnline) {
        return (
            <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-white/5 border-t-red-600 rounded-full animate-spin mb-6"></div>
                <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">Syncing Terminal...</p>
            </div>
        );
    }

    if (!isOnline && !profile) {
        return (
            <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8">
                    <i className="fas fa-signal-slash text-white/10 text-4xl"></i>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">No Network</h2>
                <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px] max-w-[280px] mb-8">
                    Terminal requires a data connection for initial authentication and assignment sync.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                    Reconnect Terminal
                </button>
            </div>
        );
    }

    return <>{children}</>;
};
