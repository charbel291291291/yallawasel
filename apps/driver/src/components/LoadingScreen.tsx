import React from 'react';

/**
 * PRODUCTION LOADING SYSTEM
 * High-fidelity tactical loading screen for terminal initialization.
 */
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Syncing Terminal State' }) => {
    return (
        <div className="fixed inset-0 bg-[#0E0E11] z-[2000] flex flex-col items-center justify-center p-8 overflow-hidden select-none">
            {/* Background Environmental Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:32px_32px]"></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent"></div>
            </div>

            <div className="relative flex flex-col items-center animate-entrance">
                {/* Tactical Spinner */}
                <div className="relative mb-8 group">
                    <div className="w-16 h-16 border-2 border-white/5 rounded-full flex items-center justify-center">
                        <div className="w-10 h-10 border-2 border-transparent border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute -inset-4 border border-red-600/10 rounded-full animate-ping opacity-20"></div>
                </div>

                {/* Progress Indicators */}
                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-3 animate-pulse">
                    {message}
                </h2>

                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-1 h-1 bg-red-600 rounded-full animate-bounce [animation-delay:${i * 0.2}s]`}></div>
                    ))}
                </div>
            </div>

            {/* Tactical Footer */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
                <p className="text-[7px] font-black text-white/10 uppercase tracking-[1em]">
                    Satellite Uplink Secured
                </p>
            </div>
        </div>
    );
};
