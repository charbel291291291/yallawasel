import React from 'react';

interface Props {
    children: React.ReactNode;
    title?: string;
}

/**
 * PRODUCTION TERMINAL LAYOUT
 * Optimized for Standalone PWA mode with strict viewport containment.
 * Enforces Rule 6: Mobile-first responsive layout with no user-scaling.
 */
export const TerminalLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="h-screen w-screen bg-[#0A0C14] text-white flex flex-col font-sans select-none overflow-hidden relative overscroll-none">
            {/* Real-time Environmental Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Corner Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/[0.03] blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#B9975B]/[0.02] blur-[150px] rounded-full"></div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* Operational Scanlines */}
                <div className="fixed inset-0 scanline opacity-[0.03]"></div>
            </div>

            {/* Content Viewport */}
            <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-[100px] scroll-smooth pt-safe">
                <div className="w-full h-full animate-entrance">
                    {children}
                </div>
            </div>

            {/* Terminal Border Accents */}
            <div className="fixed inset-0 pointer-events-none border border-white/[0.03] z-[100]"></div>
            <div className="fixed top-0 left-0 w-8 h-8 border-t border-l border-red-600/30 z-[101]"></div>
            <div className="fixed top-0 right-0 w-8 h-8 border-t border-r border-[#B9975B]/20 z-[101]"></div>

            <style>{`
                .pt-safe {
                    padding-top: env(safe-area-inset-top);
                }
                body {
                    overflow: hidden;
                    position: fixed;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};
