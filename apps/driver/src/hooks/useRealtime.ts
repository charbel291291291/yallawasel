import { useEffect } from 'react';
import { useDriverStore } from '../store/useDriverStore';
import { MissionService } from '../services/missionService';
import { WalletService } from '../services/walletService';

/**
 * PRODUCTION REALTIME HOOK
 * Orchestrates all Supabase Realtime subscriptions with high reliability.
 */
export const useRealtime = () => {
    const {
        profile,
        isShiftActive,
        isOnline,
        activeOrder,
        addLogEntry,
        syncOperationalState,
        setIncomingOrders
    } = useDriverStore();

    useEffect(() => {
        if (!profile || !isShiftActive) return;

        console.log('[Realtime] Establishing operational uplink...');

        // 1. Subscribe to Assignments (only if IDLE or Online)
        const missionSub = MissionService.subscribeToNewMissions((newOrder) => {
            if (isOnline && !activeOrder) {
                const currentOrders = useDriverStore.getState().incomingOrders;
                setIncomingOrders([newOrder, ...currentOrders]);
                addLogEntry('accept', 'New assignment detected in sector');
            }
        });

        // 2. Subscribe to Wallet/Financial Changes
        const walletSub = WalletService.subscribeToWallet(profile.id, (_update) => {
            syncOperationalState();
            addLogEntry('delivered', 'Financial ledger updated');
        });

        return () => {
            console.log('[Realtime] Severing operational uplink...');
            missionSub.unsubscribe();
            walletSub.unsubscribe();
        };
    }, [profile?.id, isShiftActive, isOnline, !!activeOrder, setIncomingOrders, syncOperationalState, addLogEntry]);
};
