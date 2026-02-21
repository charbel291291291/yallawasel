import { useEffect, useRef, useCallback } from 'react';
import { useDriverStore } from '../../store/useDriverStore';
import { DriverService } from '../../services/driverService';
import { OrderService } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';

export function useDriverTerminal() {
    const {
        profile,
        isOnline,
        setOnlineStatus,
        setStatus,
        setLocation,
        setIncomingOrders,
        setActiveOrder,
        setDriverStats
    } = useDriverStore();


    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const orderSubscription = useRef<any>(null);

    // 📍 Heartbeat Logic
    const startHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) return;

        const pulse = async () => {
            if (!profile) return;

            let currentLoc = null;
            try {
                if ('geolocation' in navigator) {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, {
                            enableHighAccuracy: true,
                            timeout: 5000
                        })
                    );
                    currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(currentLoc);
                }
            } catch (err) {
                console.warn("[Terminal] Location pulse failed:", err);
            }

            await DriverService.updateStatus(profile.id, true, currentLoc || undefined);

            // Re-fetch stats during pulse
            const stats = await DriverService.getDriverStats(profile.id);
            if (stats) setDriverStats(stats);
        };

        pulse();
        heartbeatTimer.current = setInterval(pulse, 15000); // Pulse every 15s
    }, [profile, setLocation, setDriverStats]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) {
            clearInterval(heartbeatTimer.current);
            heartbeatTimer.current = null;
        }
        if (profile) {
            DriverService.updateStatus(profile.id, false);
        }
    }, [profile]);

    // 📡 Live Feed Logic
    const startOrderFeed = useCallback(() => {
        if (orderSubscription.current) return;

        // Initial Fetch
        OrderService.getPendingOrders().then(setIncomingOrders);

        // Subscribe
        orderSubscription.current = OrderService.subscribeToFeed(async () => {
            const freshOrders = await OrderService.getPendingOrders();
            setIncomingOrders(freshOrders);
        });
    }, [setIncomingOrders]);

    const stopOrderFeed = useCallback(() => {
        if (orderSubscription.current) {
            orderSubscription.current.unsubscribe();
            orderSubscription.current = null;
        }
        setIncomingOrders([]);
    }, [setIncomingOrders]);

    // 🔄 Master Toggle
    const toggleOnline = useCallback(() => {
        const nextState = !isOnline;
        setOnlineStatus(nextState);

        if (nextState) {
            startHeartbeat();
            startOrderFeed();
        } else {
            stopHeartbeat();
            stopOrderFeed();
            setStatus('OFFLINE');
        }
    }, [isOnline, setOnlineStatus, startHeartbeat, startOrderFeed, stopHeartbeat, stopOrderFeed, setStatus]);

    // 🛠 Lifecycle Sync
    useEffect(() => {
        // Sync active order on mount/re-hydration
        if (profile && isOnline) {
            // Check if driver has an existing assigned/accepted order
            supabase.from('orders')
                .select('*')
                .eq('driver_id', profile.id)
                .in('status', ['assigned', 'accepted', 'picked_up', 'delivered'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setActiveOrder(data);
                        // Map internal status to terminal status
                        if (data.status === 'assigned' || data.status === 'accepted') setStatus('ORDER_ASSIGNED');
                        if (data.status === 'picked_up') setStatus('PICKED_UP');
                        if (data.status === 'delivered') setStatus('DELIVERING');
                    }
                });
        }
    }, [profile, isOnline, setActiveOrder, setStatus]);

    return { toggleOnline };
}
