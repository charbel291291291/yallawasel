import React from 'react';

interface DriverRootLayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean;
}

/**
 * 🏢 9️⃣ ENTERPRISE STRUCTURE - Isolated Driver PWA Layout
 * 
 * Behaves as a full-viewport operational dashboard.
 * 🧱 2️⃣ CORRECT ROOT STRUCTURE: Edge-to-edge, h-screen, bg-black.
 * 🖥 4️⃣ DESKTOP RESPONSIVENESS: No centering, no empty side space.
 */
const DriverRootLayout: React.FC<DriverRootLayoutProps> = ({ children, showSidebar = true }) => {
    return (
        <div className="h-screen w-screen flex flex-col bg-black text-white font-sans overflow-hidden">
            {/* 🏗 TOP OPERATIONAL BAR */}
            <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <img src="/icons/icon-192x192.png" alt="YW" className="w-8 h-8 rounded-lg" />
                    <span className="font-black text-xl tracking-tighter uppercase">YW Driver <span className="text-red-500">Ops</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Network Stable</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* 🧭 5️⃣ SIDEBAR / DASHBOARD STRUCTURE */}
                {showSidebar && (
                    <aside className="w-64 shrink-0 border-r border-white/10 bg-slate-950/50 flex flex-col hidden lg:flex">
                        <nav className="flex-1 p-4 space-y-2">
                            <div className="h-10 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-sm font-bold opacity-100">Active Jobs</div>
                            <div className="h-10 border border-transparent flex items-center px-4 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">Schedule</div>
                            <div className="h-10 border border-transparent flex items-center px-4 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">Earnings</div>
                            <div className="h-10 border border-transparent flex items-center px-4 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">Profile</div>
                        </nav>
                        <div className="p-4 border-t border-white/5 opacity-30 text-[10px] font-bold uppercase tracking-[0.2em] text-center">
                            v1.0.0-PROD
                        </div>
                    </aside>
                )}

                {/* 🚀 MAIN CONTENT AREA - Operational Fill */}
                <main className="flex-1 overflow-auto bg-[#050505] relative contain-layout scanline">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DriverRootLayout;
