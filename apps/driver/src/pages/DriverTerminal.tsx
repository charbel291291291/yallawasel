import React, { useState, useEffect, useCallback } from 'react';
import DriverRootLayout from '../layouts/DriverRootLayout';
import { OrderService } from '../services/orderService';
import { DriverService } from '../services/driverService';
import { OfflineQueue } from '../services/offlineQueue';
import { useAuth } from '../hooks/useAuth';
import type { Order, QueuedOperation } from '../types';

const DriverTerminal: React.FC = () => {
    const { user, signOut } = useAuth();
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [driverStats, setDriverStats] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🛡 8️⃣ RECONCILIATION STRATEGY
    const reconcileState = useCallback(async () => {
        try {
            const freshOrders = await OrderService.getPendingOrders();
            setPendingOrders(freshOrders);
            if (user) {
                const stats = await DriverService.getDriverStats(user.id);
                setDriverStats(stats);
            }
        } catch (err) {
            console.error("Reconciliation failed:", err);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Initialize State
        reconcileState();

        // Timer for countdowns
        const secondTicker = setInterval(() => setCurrentTime(Date.now()), 1000);

        // 🟢 2️⃣ HEARTBEAT & HEARTBEAT SYSTEM
        const stopHeartbeat = DriverService.startHeartbeat(user.id);
        setIsOnline(true);

        // 📡 9️⃣ LOAD SAFETY & REALTIME FEED
        const cleanupFeed = OrderService.subscribeToOrderFeed(
            (newOrder: Order) => {
                setPendingOrders(prev => [newOrder, ...prev]);
            },
            (payload: any) => {
                // Remove from UI if no longer pending or expired
                if (payload.new && (payload.new.status !== 'pending' || payload.new.expired)) {
                    setPendingOrders(prev => prev.filter(o => o.id !== payload.new.id));
                } else if (!payload.new && payload.old) {
                    // Handle DELETE
                    setPendingOrders(prev => prev.filter(o => o.id !== payload.old.id));
                }
            }
        );

        // 🛡 8️⃣ RECONCILIATION TIMER (Every 60s)
        const reconciliationInterval = setInterval(reconcileState, 60000);

        // 🔄 7️⃣ OFFLINE QUEUE PROCESSING
        const handleOnline = () => {
            OfflineQueue.processQueue(async (op: QueuedOperation) => {
                if (op.type === 'accept_order') {
                    await OrderService.acceptOrder(op.payload.orderId);
                }
            });
        };
        window.addEventListener('online', handleOnline);

        return () => {
            stopHeartbeat();
            cleanupFeed();
            clearInterval(reconciliationInterval);
            clearInterval(secondTicker);
            window.removeEventListener('online', handleOnline);
        };
    }, [user, reconcileState]);

    const handleAcceptOrder = async (orderId: string) => {
        setLoading(true);
        setError(null);

        // 📦 7️⃣ OFFLINE QUEUE SYSTEM
        if (!navigator.onLine) {
            try {
                await OfflineQueue.enqueue({
                    type: 'accept_order',
                    payload: { orderId }
                });
                setPendingOrders(prev => prev.filter(o => o.id !== orderId));
                alert("You are offline. Order acceptance queued.");
            } catch (err) {
                setError("Failed to queue order.");
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const assignedOrder = await OrderService.acceptOrder(orderId);
            setPendingOrders(prev => prev.filter(o => o.id !== orderId));

            // Immediately refresh stats to show speed score increase
            if (user) {
                const stats = await DriverService.getDriverStats(user.id);
                setDriverStats(stats);
            }

            alert(`Order #${assignedOrder.id.slice(0, 8)} accepted! Bonus: $${assignedOrder.payout_bonus}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DriverRootLayout>
            <div className="p-8 lg:p-12 h-full flex flex-col">
                <div className="shrink-0 mb-12 flex justify-between items-start">
                    <div>
                        <h1 className="text-5xl font-black mb-2 tracking-tight">Active Terminal</h1>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Operational Command Center • Real-time Orders Feed</p>
                    </div>

                    <div className="flex gap-4">
                        {/* 🏆 SPEED SCORE */}
                        <div className="flex flex-col items-center bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Speed Score</span>
                            <span className="text-2xl font-black text-white">{driverStats?.speed_score || 80}</span>
                        </div>

                        {/* 🟢 ONLINE STATUS */}
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Active' : 'Offline'}</span>
                        </div>

                        {/* 🚪 LOGOUT */}
                        <button
                            onClick={signOut}
                            className="flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-2xl transition-all active:scale-95 group"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Sign Out</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm font-bold animate-pulse">
                        ⚠️ {error}
                    </div>
                )}

                <div className="flex-1 overflow-auto no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingOrders.length === 0 ? (
                            <div className="col-span-full h-64 border-2 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center text-white/20 font-black uppercase tracking-widest">
                                Waiting for incoming orders...
                            </div>
                        ) : (
                            pendingOrders.map((order) => {
                                const secondsLeft = order.expires_at
                                    ? Math.max(0, Math.floor((new Date(order.expires_at).getTime() - currentTime) / 1000))
                                    : 0;
                                const isBoosted = order.boost_level > 0;

                                return (
                                    <div key={order.id} className={`bg-slate-900/50 border ${isBoosted ? 'border-amber-500/50' : 'border-white/10'} p-8 rounded-[2.5rem] flex flex-col hover:border-white/30 transition-all group animate-3d-entrance relative overflow-hidden`}>
                                        {isBoosted && (
                                            <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                                                Boost Active
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white/40 tracking-widest w-fit text-nowrap">Pending</span>
                                                    {secondsLeft > 0 && (
                                                        <span className={`text-[11px] font-black ${secondsLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white/60'}`}>
                                                            {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                                                        </span>
                                                    )}
                                                </div>
                                                {order.payout_bonus > 0 && (
                                                    <span className="text-[10px] text-green-400 font-bold uppercase">+$ {order.payout_bonus} Speed Bonus</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Earnings</p>
                                                <span className="text-2xl font-black text-green-400">${(order.payout_base + order.payout_bonus).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Pickup</p>
                                                <p className="text-sm font-bold text-white/80 truncate font-mono">{order.pickup_address || order.address || "Main Branch"}</p>
                                            </div>
                                            <div className="h-4 w-px bg-white/10 ml-2"></div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Dropoff</p>
                                                <p className="text-sm font-bold text-white/80 truncate font-mono">{order.dropoff_address || order.address || "Contact Customer"}</p>
                                            </div>
                                        </div>

                                        <button
                                            disabled={loading || secondsLeft === 0}
                                            onClick={() => handleAcceptOrder(order.id)}
                                            className="mt-auto w-full py-4 bg-white text-black font-black rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                                        >
                                            {loading ? "PROCESSING..." : secondsLeft === 0 ? "EXPIRED" : "ACCEPT JOB"}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </DriverRootLayout>
    );
};

export default DriverTerminal;
