import React, { useState, useEffect } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { OrderService } from '../../../services/orderService';


export const IncomingFeed: React.FC = () => {
    const { incomingOrders, setActiveOrder } = useDriverStore();

    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const handleAccept = async (orderId: string) => {
        try {
            const acceptedOrder = await OrderService.acceptOrder(orderId);
            setActiveOrder(acceptedOrder);
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (incomingOrders.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <i className="fas fa-satellite-dish text-white/20 text-2xl"></i>
                </div>
                <h3 className="text-white/40 font-black uppercase tracking-[0.4em] text-xs">Waiting for Assignments...</h3>
                <p className="text-white/10 text-[10px] uppercase font-bold tracking-widest mt-2 px-12">Move to a high-demand zone to increase chance of matching</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Near you ({incomingOrders.length})</h3>
                <div className="h-px flex-1 bg-white/5 ml-4"></div>
            </div>

            {incomingOrders.map(order => {
                const expiresLabel = order.expires_at ? new Date(order.expires_at).getTime() : 0;
                const secondsLeft = Math.max(0, Math.floor((expiresLabel - currentTime) / 1000));

                return (
                    <div key={order.id} className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group animate-3d-entrance">
                        {/* Progress Bar for Expiration */}
                        <div
                            className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(secondsLeft / 60) * 100}%` }}
                        ></div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block">
                                    Flash Job
                                </span>
                                <p className="text-2xl font-black text-white tracking-tighter">${(order.payout_base + order.payout_bonus).toFixed(2)}</p>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Est. Earnings</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-white/10 tabular-nums">{secondsLeft}s</p>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Time Remaining</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex gap-4">
                                <div className="w-8 flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    <div className="flex-1 w-px bg-white/5 my-1"></div>
                                    <div className="w-2 h-2 bg-red-600 rounded-sm"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="mb-4">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Pickup</p>
                                        <p className="text-sm font-bold text-white/80">{order.pickup_address || 'Merchant Location'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Destination</p>
                                        <p className="text-sm font-bold text-white/80">{order.dropoff_address || 'Customer Residence'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/40 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">
                                Hidden
                            </button>
                            <button
                                onClick={() => handleAccept(order.id)}
                                className="flex-[2] py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-600/20"
                            >
                                Accept Fast
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
