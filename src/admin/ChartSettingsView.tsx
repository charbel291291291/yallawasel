
import React, { useEffect, useState } from 'react';
import { ChartService, ChartSettings, LiveOffer } from '@/services/chartService';
import LiveBreakingChart from '@/components/LiveBreakingChart';
// import { motion } from 'framer-motion';
import { Settings, Sliders, Palette, Activity, Plus } from 'lucide-react';
// import { toast } from 'react-hot-toast';

const ChartSettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'visuals' | 'data' | 'offers'>('visuals');
    const [settings, setSettings] = useState<ChartSettings | null>(null);
    const [offers, setOffers] = useState<LiveOffer[]>([]);
    const [loading, setLoading] = useState(true);

    // Offer Form
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
            // Don't leave user stuck, allow render with defaults/empty state
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
            // toast.success('Offer created');
        }
    };

    const handleUpdatePrice = async (id: string, newPrice: number) => {
        await ChartService.updateOfferPrice(id, newPrice);
        loadData();
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Chart Capabilities...</div>;

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
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <div>
                    {!settings && <div className="text-amber-500 text-xs font-bold mb-1">OFFLINE MODE: Using Defaults</div>}
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="text-primary" /> Live Chart Control Center
                    </h2>
                    <p className="text-gray-500 text-sm">Customize the breaking news ticker and offer visualization.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('visuals')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'visuals' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Palette className="w-4 h-4 inline mr-2" /> Visuals
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'data' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Settings className="w-4 h-4 inline mr-2" /> Data
                    </button>
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'offers' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Sliders className="w-4 h-4 inline mr-2" /> Offers Manager
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PREVIEW PANEL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-4">Live Preview</h3>
                        <LiveBreakingChart />
                    </div>

                    {/* SETTINGS PANELS */}
                    {activeTab === 'visuals' && (
                        <div className="bg-white p-6 rounded-2xl border shadow-sm grid grid-cols-2 gap-6">
                            <ColorInput label="Primary Color" value={currentSettings.primary_color} onChange={(v) => handleUpdateSetting('primary_color', v)} />
                            <ColorInput label="Background" value={currentSettings.background_color} onChange={(v) => handleUpdateSetting('background_color', v)} />
                            <ColorInput label="Positive Trend" value={currentSettings.positive_color} onChange={(v) => handleUpdateSetting('positive_color', v)} />
                            <ColorInput label="Negative Trend" value={currentSettings.negative_color} onChange={(v) => handleUpdateSetting('negative_color', v)} />
                            <ColorInput label="Grid Lines" value={currentSettings.grid_color} onChange={(v) => handleUpdateSetting('grid_color', v)} />
                            <ColorInput label="Text Color" value={currentSettings.text_color} onChange={(v) => handleUpdateSetting('text_color', v)} />

                            <div className="col-span-2 border-t pt-4 mt-2">
                                <label className="flex items-center justify-between mb-4 cursor-pointer">
                                    <span className="font-medium">Line Thickness ({currentSettings.line_thickness}px)</span>
                                    <input
                                        type="range" min="1" max="10"
                                        value={currentSettings.line_thickness}
                                        onChange={(e) => handleUpdateSetting('line_thickness', Number(e.target.value))}
                                        className="w-48 accent-primary"
                                    />
                                </label>
                                <label className="flex items-center justify-between mb-2 cursor-pointer">
                                    <span className="font-medium">Show Smooth Curves</span>
                                    <input
                                        type="checkbox"
                                        checked={currentSettings.show_smooth_curves}
                                        onChange={(e) => handleUpdateSetting('show_smooth_curves', e.target.checked)}
                                        className="toggle"
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="font-medium">Shadow Glow Effect</span>
                                    <input
                                        type="checkbox"
                                        checked={currentSettings.show_shadow_glow}
                                        onChange={(e) => handleUpdateSetting('show_shadow_glow', e.target.checked)}
                                        className="toggle"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                            <form onSubmit={handleCreateOffer} className="flex gap-4 mb-8">
                                <input
                                    type="text"
                                    placeholder="Offer Title (e.g. BTC-USD, Gold Pass)"
                                    value={newOffer.title}
                                    onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={newOffer.price || ''}
                                    onChange={e => setNewOffer({ ...newOffer, price: Number(e.target.value) })}
                                    className="w-32 px-4 py-2 border rounded-lg"
                                    required
                                />
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </form>

                            <div className="space-y-2">
                                {offers.map(offer => (
                                    <div key={offer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border hover:border-primary transition-colors">
                                        <div>
                                            <div className="font-bold">{offer.title}</div>
                                            <div className="text-xs text-gray-500">{offer.status}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdatePrice(offer.id, offer.current_price - 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                                >-</button>
                                                <span className="font-mono font-bold w-20 text-center text-lg">${offer.current_price}</span>
                                                <button
                                                    onClick={() => handleUpdatePrice(offer.id, offer.current_price + 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR HELP */}
                <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2">Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-2 list-disc pl-4">
                            <li>Use high contrast colors for better visibility.</li>
                            <li>"Live Offers" drive the chart data automatically.</li>
                            <li>Changing prices updates the connected clients instantly.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{value}</span>
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded-full border-none cursor-pointer overflow-hidden"
            />
        </div>
    </div>
);

export default ChartSettingsView;
