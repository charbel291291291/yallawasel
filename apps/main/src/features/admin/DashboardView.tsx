import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    bg: string;
    trend?: string;
    trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color,
    bg,
    trend,
    trendUp,
}) => (
    <div className="admin-card p-6 hover:-translate-y-1 transition-transform cursor-default">
        <div className="flex justify-between items-start mb-4">
            <div
                className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center text-xl`}
            >
                <i className={`fa-solid ${icon}`}></i>
            </div>
            {trend && (
                <div
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        }`}
                >
                    {trend}
                </div>
            )}
        </div>
        <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
            </p>
        </div>
    </div>
);

interface LogItemProps {
    label: string;
    time: string;
    type: string;
}

const LogItem: React.FC<LogItemProps> = ({ label, time }) => {

    return (
        <div className="flex gap-3 group">
            <div className="mt-1">
                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors"></div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
                    {label}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{time}</p>
            </div>
        </div>
    );
};

const DashboardView: React.FC = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        customers: 0,
        orders: 0,
        kits: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: cCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });
            const { data: oData } = await supabase.from("orders").select("total, status");
            const { count: pCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true });
            const orders = oData || [];
            const revenue = orders
                .filter((o) => o.status === "delivered")
                .reduce((s, o) => s + (Number(o.total) || 0), 0);
            setStats({
                revenue,
                customers: cCount || 0,
                orders: orders.length,
                kits: pCount || 0,
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading)
        return (
            <div className="h-64 flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-200"></i>
            </div>
        );

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Here's what's happening with your store today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-admin btn-admin-secondary text-xs">
                        <i className="fa-solid fa-cloud-arrow-down"></i> Export Report
                    </button>
                    <button className="btn-admin btn-admin-primary text-xs">
                        <i className="fa-solid fa-plus"></i> New Order
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={`$${stats.revenue.toLocaleString()}`}
                    icon="fa-sack-dollar"
                    trend="+12%"
                    trendUp={true}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    label="Active Customers"
                    value={stats.customers}
                    icon="fa-users"
                    trend="+5%"
                    trendUp={true}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    label="Total Orders"
                    value={stats.orders}
                    icon="fa-cart-shopping"
                    trend="+8%"
                    trendUp={true}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <StatCard
                    label="Products Active"
                    value={stats.kits}
                    icon="fa-box"
                    trend="0%"
                    trendUp={true}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
            </div>

            {/* Charts & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 admin-card p-6 h-96 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 text-3xl mb-4">
                        <i className="fa-solid fa-chart-area"></i>
                    </div>
                    <h3 className="text-slate-900 font-bold">Revenue Analytics</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm">
                        Detailed revenue charts and customer acquisition metrics will be
                        available in the next update.
                    </p>
                </div>

                <div className="admin-card p-6 h-96 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">System Activity</h3>
                        <button className="text-xs text-blue-600 font-bold hover:underline">
                            View All
                        </button>
                    </div>
                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        <LogItem
                            label="Price updated for 'Adonis Survival Kit'"
                            time="2 mins ago"
                            type="update"
                        />
                        <LogItem
                            label="New order #ORD-7782 received"
                            time="15 mins ago"
                            type="order"
                        />
                        <LogItem
                            label="Happy Hour started: 'Sunday BBQ'"
                            time="1 hour ago"
                            type="alert"
                        />
                        <LogItem
                            label="Database backup successful"
                            time="3 hours ago"
                            type="system"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
