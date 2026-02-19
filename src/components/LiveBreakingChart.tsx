
import React, { useEffect, useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { supabase } from '@/services/supabaseClient'; // Ensure correct path
import { ChartService, ChartSettings, LiveOffer } from '@/services/chartService'; // Adjust import path
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SETTINGS: ChartSettings = {
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
};

const LiveBreakingChart: React.FC = () => {
    const [settings, setSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
    const [data, setData] = useState<{ time: string; value: number }[]>([]);
    const [offers, setOffers] = useState<LiveOffer[]>([]);
    const [marketTrend, setMarketTrend] = useState<'up' | 'down' | 'neutral'>('neutral');

    // Load Initial Settings & Data
    useEffect(() => {
        fetchSettings();
        fetchMarketData();

        // Realtime Subscriptions
        const settingsSub = supabase
            .channel('chart-settings-update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chart_settings' }, (payload) => {
                setSettings(payload.new as ChartSettings);
            })
            .subscribe();

        const offersSub = supabase
            .channel('live-offers-update')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_offers' }, () => {
                fetchMarketData(); // Refresh data on any offer change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(settingsSub);
            supabase.removeChannel(offersSub);
        };
    }, []);

    const fetchSettings = async () => {
        const s = await ChartService.getSettings();
        if (s) setSettings(s);
    };

    const fetchMarketData = async () => {
        const activeOffers = await ChartService.getLiveOffers();
        setOffers(activeOffers);

        // Simulate/Calculate Market Index History
        // In a real app, we'd fetch historical aggregates.
        // Here we'll generate a live point based on current average.
        const avgPrice = activeOffers.length > 0
            ? activeOffers.reduce((sum, o) => sum + o.current_price, 0) / activeOffers.length
            : 0;

        setData(prev => {
            const newData = [...prev, { time: new Date().toLocaleTimeString(), value: avgPrice }];
            return newData.slice(-settings.max_data_points); // Keep window size
        });

        // Determine trend
        if (data.length > 1) {
            const last = data[data.length - 1].value;
            const prev = data[data.length - 2].value;
            setMarketTrend(last > prev ? 'up' : last < prev ? 'down' : 'neutral');
        }
    };

    // Dynamic Styles
    const containerStyle = {
        background: settings.dark_mode_enabled ? '#1f2937' : settings.background_color,
        color: settings.text_color,
        borderRadius: settings.rounded_edges ? '1rem' : '0',
        boxShadow: settings.show_shadow_glow ? `0 0 20px -5px ${settings.primary_color}40` : 'none',
    };

    const lineColor = marketTrend === 'up' ? settings.positive_color : marketTrend === 'down' ? settings.negative_color : settings.primary_color;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 w-full h-[400px] flex flex-col relative overflow-hidden transition-all duration-500`}
            style={containerStyle}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 z-10">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-70">Live Market Index</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tabular-nums">
                            {data.length > 0 ? data[data.length - 1].value.toFixed(2) : '0.00'}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${marketTrend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {marketTrend === 'up' ? '▲' : '▼'} LIVE
                        </span>
                    </div>
                </div>

                {/* Ticker */}
                <div className="flex gap-4 overflow-hidden mask-linear-fade">
                    <AnimatePresence>
                        {offers.slice(0, 3).map(offer => (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col text-right"
                            >
                                <span className="text-xs font-bold truncate max-w-[100px]">{offer.title}</span>
                                <span className={`text-xs font-mono ${offer.movement === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                    {offer.current_price.toFixed(2)}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.grid_color} opacity={0.5} />
                        <XAxis
                            dataKey="time"
                            stroke={settings.text_color}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            stroke={settings.text_color}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: settings.tooltip_bg_color,
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Area
                            type={settings.show_smooth_curves ? "monotone" : "linear"}
                            dataKey="value"
                            stroke={lineColor}
                            strokeWidth={settings.line_thickness}
                            fill="url(#colorValue)"
                            animationDuration={settings.animation_speed}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default LiveBreakingChart;
