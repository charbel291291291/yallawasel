import React from 'react';

import DriverRootLayout from './layouts/DriverRootLayout';

const App: React.FC = () => {
    return (
        <DriverRootLayout>
            <div className="p-8 lg:p-12 h-fit">
                <h1 className="text-5xl font-black mb-2 tracking-tight">Active Terminal</h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-12">Logistics & Delivery Operational Dashboard</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-[2rem] hover:border-red-500/50 transition-colors group">
                        <h3 className="text-xl font-bold mb-2">Authenticated Status</h3>
                        <p className="text-white/60 mb-6 text-sm">Security credentials verified for current session.</p>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-green-500"></div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/10 p-6 rounded-[2rem] opacity-50">
                        <h3 className="text-xl font-bold mb-2">Live Map View</h3>
                        <p className="text-white/60 text-sm">Real-time geospatial tracking coming in v1.1</p>
                    </div>
                </div>
            </div>
        </DriverRootLayout>
    );
};

export default App;
