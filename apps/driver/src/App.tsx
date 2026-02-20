import React, { useState, useEffect, useCallback } from 'react';
import DriverRootLayout from './layouts/DriverRootLayout';
import { OrderService, Order } from './services/orderService';
import { DriverService } from './services/driverService';
import { OfflineQueue } from './services/offlineQueue';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🛡 8️⃣ RECONCILIATION STRATEGY
    const reconcileState = useCallback(async () => {
        try {
            const freshOrders = await OrderService.getPendingOrders();
            setPendingOrders(freshOrders);
        } catch (err) {
            console.error("Reconciliation failed:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        // Initialize State
        reconcileState();

        // 🟢 2️⃣ HEARTBEAT & HEARTBEAT SYSTEM
        const stopHeartbeat = DriverService.startHeartbeat(user.id);
        setIsOnline(true);

        // 📡 9️⃣ LOAD SAFETY & REALTIME FEED
        const cleanupFeed = OrderService.subscribeToOrderFeed(
            (newOrder) => {
                setPendingOrders(prev => [newOrder, ...prev]);
            },
            (payload) => {
                // Remove from UI if no longer pending or expired
                if (payload.new.status !== 'pending' || payload.new.expired) {
                    setPendingOrders(prev => prev.filter(o => o.id !== payload.new.id));
                }
            }
        );

        // 🛡 8️⃣ RECONCILIATION TIMER (Every 60s)
        const reconciliationInterval = setInterval(reconcileState, 60000);

        // 🔄 7️⃣ OFFLINE QUEUE PROCESSING
        const handleOnline = () => {
            OfflineQueue.processQueue(async (op) => {
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
            alert(`Order #${assignedOrder.id.slice(0, 8)} accepted successfully!`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white">Initializing Terminal...</div>;
    if (!user) return <div className="h-screen bg-black flex items-center justify-center text-white">Please Login to Access Driver Terminal</div>;

    return (
        <DriverRootLayout>
            <div className="p-8 lg:p-12 h-full flex flex-col">
                <div className="shrink-0 mb-12 flex justify-between items-start">
                    <div>
                        <h1 className="text-5xl font-black mb-2 tracking-tight">Active Terminal</h1>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Operational Command Center • Real-time Orders Feed</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Active' : 'Offline'}</span>
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
                            pendingOrders.map((order) => (
                                <div key={order.id} className="bg-slate-900/50 border border-white/10 p-8 rounded-[2.5rem] flex flex-col hover:border-white/30 transition-all group animate-3d-entrance">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white/40 tracking-widest w-fit">Pending</span>
                                            {order.expires_at && (
                                                <span className="text-[9px] text-red-400 font-bold uppercase">Expires: {new Date(order.expires_at).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                        <span className="text-2xl font-black text-green-400">${order.price}</span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Pickup</p>
                                            <p className="text-sm font-bold text-white/80 truncate">{order.pickup_address || order.address || "Main Branch"}</p>
                                        </div>
                                        <div className="h-6 w-0.5 bg-white/5 ml-2 border-l border-dashed border-white/20"></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-1">Dropoff</p>
                                            <p className="text-sm font-bold text-white/80 truncate">{order.dropoff_address || order.address || "Contact Customer"}</p>
                                        </div>
                                    </div>

                                    <button
                                        disabled={loading}
                                        onClick={() => handleAcceptOrder(order.id)}
                                        className="mt-auto w-full py-4 bg-white text-black font-black rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                                    >
                                        {loading ? "PROCESSING..." : "ACCEPT JOB"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DriverRootLayout>
    );
};

export default App;
