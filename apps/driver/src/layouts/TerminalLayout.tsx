import React from 'react';

interface Props {
    children: React.ReactNode;
    title?: string;
}

export const TerminalLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col font-sans select-none overflow-hidden relative">
            {/* Real-time Environmental Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Corner Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/[0.03] blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/[0.03] blur-[150px] rounded-full"></div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* Tactical Grit Overlay */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>

                {/* Operational Scanlines */}
                <div className="fixed inset-0 scanline opacity-[0.05]"></div>
            </div>

            {/* Content Viewport */}
            <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-[150px] scroll-smooth">
                <div className="w-full h-full animate-entrance">
                    {children}
                </div>
            </div>

            {/* Terminal Border Accents */}
            <div className="fixed inset-0 pointer-events-none border border-white/[0.03] z-[100]"></div>
            <div className="fixed top-0 left-0 w-8 h-8 border-t border-l border-red-600/30 z-[101]"></div>
            <div className="fixed top-0 right-0 w-8 h-8 border-t border-r border-white/5 z-[101]"></div>
            <div className="fixed bottom-0 left-0 w-8 h-8 border-b border-l border-white/5 z-[101]"></div>
            <div className="fixed bottom-0 right-0 w-8 h-8 border-b border-r border-blue-600/30 z-[101]"></div>
        </div>
    );
};
