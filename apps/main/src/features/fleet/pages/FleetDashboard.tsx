import React, { useState } from 'react';
import { FleetLayout } from '../components/FleetLayout';
import { KPICards } from '../components/KPICards';
import { DriversTable } from '../components/DriversTable';
import { ActiveMissionsPanel } from '../components/ActiveMissionsPanel';
import { RevenuePanel } from '../components/RevenuePanel';
import { HeatMapPanel } from '../components/HeatMapPanel';
import { SurgeManager } from '../components/SurgeManager';
import { DriverDetailDrawer } from '../components/DriverDetailDrawer';
import { useFleetStats } from '../hooks/useFleetStats';
import { useFleetRealtime } from '../hooks/useFleetRealtime';

const FleetDashboard: React.FC = () => {
    const { kpis, drivers, missions, loading, error, refreshData } = useFleetStats();
    const [selectedDriver, setSelectedDriver] = useState<any>(null);

    // Initialize Realtime Uplink
    useFleetRealtime(refreshData);

    if (loading) {
        return (
            <FleetLayout>
                <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fas fa-satellite-dish text-primary/40 text-xs animate-pulse"></i>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-2 animate-pulse">Establishing Satellite Uplink</h2>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Synchronizing Fleet Vector Data...</p>
                    </div>
                </div>
            </FleetLayout>
        );
    }

    if (error) {
        return (
            <FleetLayout>
                <div className="p-12 rounded-3xl bg-red-600/5 border border-red-600/20 text-center max-w-2xl mx-auto">
                    <i className="fas fa-exclamation-triangle text-red-600 text-3xl mb-6"></i>
                    <h2 className="text-lg font-black text-white uppercase mb-2">Uplink Interruption</h2>
                    <p className="text-sm text-slate-400 font-medium mb-8">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                    >
                        ReInitialize Link
                    </button>
                </div>
            </FleetLayout>
        );
    }

    return (
        <FleetLayout>
            {/* Top Section: Monitoring Overview */}
            <section className="animate-entrance">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Strategic Overview</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time performance telemetry</p>
                    </div>
                    <button
                        onClick={refreshData}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all text-slate-400 group"
                    >
                        <i className="fas fa-sync-alt mr-2 group-hover:rotate-180 transition-transform duration-700"></i>
                        Manual Force Sync
                    </button>
                </div>
                <KPICards kpis={kpis} />
            </section>

            {/* Mid Section: Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <section className="lg:col-span-8 animate-entrance delay-100">
                    <DriversTable drivers={drivers} onSelect={setSelectedDriver} />
                </section>
                <section className="lg:col-span-4 animate-entrance delay-200">
                    <ActiveMissionsPanel missions={missions} />
                </section>
            </div>

            {/* Bottom Section: Intelligence & Economics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pb-12">
                <section className="lg:col-span-8 animate-entrance delay-300">
                    <RevenuePanel data={[]} />
                </section>
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <section className="flex-1 animate-entrance delay-400">
                        <HeatMapPanel />
                    </section>
                    <section className="animate-entrance delay-500">
                        <SurgeManager />
                    </section>
                </div>
            </div>

            {/* Right Drawer for Operator Detail */}
            <DriverDetailDrawer
                driver={selectedDriver}
                onClose={() => setSelectedDriver(null)}
            />
        </FleetLayout>
    );
};

export default FleetDashboard;
