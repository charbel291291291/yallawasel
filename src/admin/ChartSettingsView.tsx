import React, { useEffect, useState } from 'react';
import { ChartService, ChartSettings, LiveOffer } from '@/services/chartService';
import LiveBreakingChart from '@/components/LiveBreakingChart';
import { Sliders, Palette, Activity, Plus, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const ChartSettingsView: React.FC = () => {
    const [settings, setSettings] = useState<ChartSettings | null>(null);
    const [offers, setOffers] = useState<LiveOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOffer, setNewOffer] = useState({ title: '', price: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, o] = await Promise.all([
                ChartService.getSettings(),
                ChartService.getLiveOffers()
            ]);
            if (s) setSettings(s);
            setOffers(o);
        } catch (e) {
            console.error("Failed to load chart data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async (key: keyof ChartSettings, value: any) => {
        if (!settings) return;
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings); // Optimistic update
        await ChartService.updateSettings({ [key]: value });
    };

    const handleCreateOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await ChartService.createOffer({
            title: newOffer.title,
            current_price: Number(newOffer.price),
            status: 'active',
            popularity_score: 0
        });
        if (success) {
            setNewOffer({ title: '', price: 0 });
            loadData();
        }
    };

    const handleUpdatePrice = async (id: string, newPrice: number) => {
        await ChartService.updateOfferPrice(id, newPrice);
        loadData();
    };

    if (loading) return <div className="p-12 text-center animate-pulse text-gray-400">Loading Ticker System...</div>;

    // Safety fallback
    const currentSettings = settings || {
        id: 1,
        primary_color: '#10b981',
        positive_color: '#10b981',
        negative_color: '#ef4444',
        background_color: '#ffffff',
        grid_color: '#e5e7eb',
        text_color: '#374151',
        tooltip_bg_color: '#1f2937',
        line_thickness: 3,
        animation_speed: 1000,
        show_smooth_curves: true,
        show_shadow_glow: true,
        dark_mode_enabled: false,
        rounded_edges: true,
        time_range: '24h',
        refresh_interval: 5000,
        max_data_points: 50,
        realtime_enabled: true,
    } as ChartSettings;

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <header className="flex justify-between items-center pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <Activity className="text-red-600" /> Live Ticker Control
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage breaking offers and customize the broadcast appearance.</p>
                </div>
                {!settings && <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Offline Mode</div>}
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* PREVIEW & VISUALS */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Live Preview */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm ring-1 ring-slate-100">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Live Broadcast Preview
                        </h3>
                        <LiveBreakingChart />
                    </div>

                    {/* Simplified Color Controls (No extraneous categories) */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm ring-1 ring-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-gray-500" /> Breaking Colors
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-green-500" /> Up Trend
                                </span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={currentSettings.positive_color}
                                        onChange={(e) => handleUpdateSetting('positive_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                    />
                                    <span className="font-mono text-sm text-gray-600">{currentSettings.positive_color}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <TrendingDown className="w-3 h-3 text-red-500" /> Down Trend
                                </span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={currentSettings.negative_color}
                                        onChange={(e) => handleUpdateSetting('negative_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                    />
                                    <span className="font-mono text-sm text-gray-600">{currentSettings.negative_color}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-blue-500" /> Base Line
                                </span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={currentSettings.primary_color}
                                        onChange={(e) => handleUpdateSetting('primary_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                    />
                                    <span className="font-mono text-sm text-gray-600">{currentSettings.primary_color}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* OFFERS MANAGER (Essential Data) */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm ring-1 ring-slate-100 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-gray-500" /> Active Ticker Items
                    </h3>

                    <form onSubmit={handleCreateOffer} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Gold, BTC, Oil..."
                            value={newOffer.title}
                            onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
                            required
                        />
                        <input
                            type="number"
                            placeholder="$"
                            value={newOffer.price || ''}
                            onChange={e => setNewOffer({ ...newOffer, price: Number(e.target.value) })}
                            className="w-20 px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
                            required
                        />
                        <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {offers.map(offer => (
                            <div key={offer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors group">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-700">{offer.title}</span>
                                    <span className="text-[10px] text-gray-400 font-mono uppercase">
                                        {offer.movement === 'up' ? '▲' : offer.movement === 'down' ? '▼' : '−'} {offer.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdatePrice(offer.id, offer.current_price - 1)}
                                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="font-mono font-bold w-16 text-center text-sm">${offer.current_price}</span>
                                    <button
                                        onClick={() => handleUpdatePrice(offer.id, offer.current_price + 1)}
                                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-green-600 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                        {offers.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-xs italic">
                                No active offers. Add one to start the ticker.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartSettingsView;
