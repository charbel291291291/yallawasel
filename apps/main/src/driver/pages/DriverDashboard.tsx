import { useContext, useEffect, useState, useCallback } from "react";
import DriverAuthContext from "../context/DriverAuthContext";
import { supabase } from "@/services/supabaseClient";
import { getDailyStats } from "../services/driverStatsService";

interface DailyStats {
    earnings: number;
    deliveries: number;
    goal: { target_deliveries: number; target_earnings: number };
}

interface Order {
    id: string;
    created_at: string;
    full_name: string;
    phone: string;
    address: string;
    total: number;
    status: string;
    payment_method: string;
    delivery_zone: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    out_for_delivery: "bg-blue-100 text-blue-700",
};

const DriverDashboard = () => {
    const { session, updateStatus } = useContext(DriverAuthContext);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DailyStats>({
        earnings: 0,
        deliveries: 0,
        goal: { target_deliveries: 10, target_earnings: 100 },
    });

    const fetchOrders = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("id, created_at, full_name, phone, address, total, status, payment_method, delivery_zone")
                .eq("driver_id", session.user.id)
                .neq("status", "delivered")
                .order("created_at", { ascending: false });

            if (!error && data) setOrders(data);
        } catch {
            // Silent — orders will remain empty
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    const fetchDriverStats = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const data = await getDailyStats(session.user.id);
            if (data) setStats(data);
        } catch {
            // Stats will remain at defaults
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (!session?.user?.id) return;
        fetchOrders();
        fetchDriverStats();
    }, [session?.user?.id, fetchOrders, fetchDriverStats]);

    const updateOrder = async (orderId: string, status: string) => {
        const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
        if (!error) fetchOrders();
    };

    const progressPercentage = Math.min(100, (stats.deliveries / stats.goal.target_deliveries) * 100);

    const getMotivation = () => {
        if (progressPercentage < 50) return "Keep going! You're doing great. 🚀";
        if (progressPercentage < 100) return "Almost there! Provide excellent service. ⭐";
        return "Goal achieved! You are a superstar! 🏆";
    };

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                            {session?.profile?.avatar_url ? (
                                <img src={session.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gray-100">
                                    {session?.profile?.full_name?.[0] || "D"}
                                </div>
                            )}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${session?.profile?.is_online ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-sm">{session?.profile?.full_name || "Driver"}</h1>
                        <p className="text-xs text-gray-500 font-medium capitalize flex items-center gap-1">
                            {session?.profile?.driver_status || "Offline"}
                            {session?.profile?.driver_status === "online" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        </p>
                    </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={session?.profile?.is_online || false}
                        onChange={(e) => updateStatus(e.target.checked ? "online" : "offline")}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 shadow-inner" />
                </label>
            </header>

            {/* Mini Dashboard Card */}
            <div className="p-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <i className="fa-solid fa-chart-line text-6xl" />
                    </div>

                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Today's Earnings</p>
                            <h2 className="text-3xl font-black mt-1 tracking-tight">${stats.earnings.toFixed(2)}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Deliveries</p>
                            <p className="text-2xl font-bold">
                                {stats.deliveries} <span className="text-sm text-gray-500">/ {stats.goal.target_deliveries}</span>
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-blue-300 font-medium">Daily Goal Progress</span>
                            <span className="text-white font-bold">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic text-center">{getMotivation()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => updateStatus("online")}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <i className="fa-solid fa-map-location-dot" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Go Online</span>
                </button>
                <button className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i className="fa-solid fa-wallet" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Withdraw</span>
                </button>
            </div>

            {/* Active Orders */}
            <div className="px-4 py-2 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Active Orders</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{orders.length} Active</span>
            </div>

            <div className="p-4 pt-0 space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <i className="fa-solid fa-circle-notch fa-spin text-gray-300 text-2xl" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i className="fa-solid fa-mug-hot text-gray-300 text-2xl" />
                        </div>
                        <p className="text-gray-500 font-medium">No active orders</p>
                        <p className="text-xs text-gray-400 mt-1">Go online to receive new requests</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        Order #{order.id.slice(0, 6)}
                                        {order.payment_method === "cash" && (
                                            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded border border-green-200">CASH</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <i className="fa-regular fa-clock" />
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                                    {order.status.replace(/_/g, " ")}
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center mt-1">
                                        <i className="fa-solid fa-location-dot text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{order.full_name}</p>
                                        <p className="text-sm text-gray-500 leading-snug mt-0.5">{order.address}</p>
                                        <div className="flex gap-2 mt-2">
                                            {order.delivery_zone && (
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium border border-gray-200">
                                                    {order.delivery_zone}
                                                </span>
                                            )}
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium border border-gray-200">
                                                {order.total} LBP
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${order.phone}`}
                                        className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                    >
                                        <i className="fa-solid fa-phone" />
                                    </a>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 grid grid-cols-2 gap-3 border-t border-gray-100">
                                <button
                                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.address)}`, "_blank")}
                                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 py-2.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-transform"
                                >
                                    <i className="fa-solid fa-map-location text-blue-500" /> Navigate
                                </button>

                                {order.status !== "out_for_delivery" && (
                                    <button
                                        onClick={() => updateOrder(order.id, "out_for_delivery")}
                                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform"
                                    >
                                        <i className="fa-solid fa-truck-fast" /> Start
                                    </button>
                                )}

                                {order.status === "out_for_delivery" && (
                                    <button
                                        onClick={() => updateOrder(order.id, "delivered")}
                                        className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform"
                                    >
                                        <i className="fa-solid fa-check-double" /> Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
