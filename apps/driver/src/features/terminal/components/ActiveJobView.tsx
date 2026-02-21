import React, { useState } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { OrderService } from '../../../services/orderService';
import { OrderMap } from './OrderMap';

export const ActiveJobView: React.FC = () => {
    const { activeOrder, status, setStatus, setActiveOrder, location } = useDriverStore();
    const [isUpdating, setIsUpdating] = useState(false);

    if (!activeOrder) return null;

    const handleTransition = async () => {
        setIsUpdating(true);
        try {
            let nextStatus: 'picked_up' | 'delivered' | 'accepted' = 'accepted';
            let nextTerminalStatus: typeof status = 'ORDER_ASSIGNED';

            if (status === 'ORDER_ASSIGNED') {
                nextStatus = 'picked_up';
                nextTerminalStatus = 'PICKED_UP';
            } else if (status === 'PICKED_UP') {
                nextStatus = 'delivered';
                nextTerminalStatus = 'DELIVERING';
            } else if (status === 'DELIVERING') {
                // Complete
                await OrderService.updateStatus(activeOrder.id, 'delivered');
                setActiveOrder(null);
                setStatus('ONLINE_IDLE');
                return;
            }

            await OrderService.updateStatus(activeOrder.id, nextStatus as any);
            setStatus(nextTerminalStatus);
            // Refresh order data if needed
            setActiveOrder({ ...activeOrder, status: nextStatus as any });

        } catch (err: any) {
            alert("Sync Failed: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getButtonText = () => {
        if (status === 'ORDER_ASSIGNED') return "Arrived / Collect Items";
        if (status === 'PICKED_UP') return "Start Delivery Flow";
        if (status === 'DELIVERING') return "Confirm Delivery Success";
        return "Process Job";
    };

    const getStepLabel = () => {
        if (status === 'ORDER_ASSIGNED') return "Heading to Merchant";
        if (status === 'PICKED_UP') return "Merchant Point Reached";
        if (status === 'DELIVERING') return "On Delivery Route";
        return "Active Job";
    };

    return (
        <div className="flex-1 flex flex-col h-full animate-3d-entrance">
            {/* Map Section */}
            <div className="flex-[1.2] min-h-[300px] p-6">
                <OrderMap
                    driverLocation={location}
                    pickupLocation={activeOrder.pickup_lat ? { lat: activeOrder.pickup_lat, lng: activeOrder.pickup_lng! } : null}
                    dropoffLocation={activeOrder.dropoff_lat ? { lat: activeOrder.dropoff_lat, lng: activeOrder.dropoff_lng! } : null}
                />
            </div>

            {/* Controls Section */}
            <div className="flex-1 bg-[#1a1a1a] border-t border-white/5 rounded-t-[3rem] p-10 flex flex-col shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-2">{getStepLabel()}</p>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                            {status === 'DELIVERING' ? 'Customer Point' : 'Merchant Point'}
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Contract Value</p>
                        <p className="text-2xl font-black text-green-400 tabular-nums">${(activeOrder.payout_base + activeOrder.payout_bonus).toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-map-marker-alt text-white/30"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-2">Terminal Target</p>
                            <p className="text-base font-bold text-white truncate">
                                {status === 'DELIVERING' ? activeOrder.dropoff_address : activeOrder.pickup_address || 'Strategic Point A'}
                            </p>
                        </div>
                        <button className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                            <i className="fas fa-phone-alt"></i>
                        </button>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    <button
                        disabled={isUpdating}
                        onClick={handleTransition}
                        className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-[13px] transition-all active:scale-95 flex items-center justify-center gap-3 ${isUpdating
                                ? 'bg-white/10 text-white/20'
                                : 'bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/5'
                            }`}
                    >
                        {isUpdating && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>}
                        {getButtonText()}
                    </button>

                    <p className="text-center text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                        Emergency Protocol: Pull to side of road before tapping
                    </p>
                </div>
            </div>
        </div>
    );
};
