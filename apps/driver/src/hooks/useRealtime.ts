import { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useDriverStore } from '../store/useDriverStore';
import { MissionService } from '../services/missionService';
import { WalletService } from '../services/walletService';

/**
 * ARCHITECTURAL HARDENING: REALTIME SAFETY
 * Uses React 18 batching and selective subscription logic to prevent main-thread flooding.
 * Implementation of Phase 3 rules.
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

        // 1. Subscribe to Assignments
        // Filtering is handled at the DB level via MissionService (pending status only)
        const missionSub = MissionService.subscribeToNewMissions((newOrder) => {
            if (isOnline && !activeOrder) {
                unstable_batchedUpdates(() => {
                    const currentOrders = useDriverStore.getState().incomingOrders;
                    setIncomingOrders([newOrder, ...currentOrders]);
                    addLogEntry('accept', 'New assignment detected in sector');
                });
            }
        });

        // 2. Subscribe to Wallet/Financial Changes (Filtered by profile.id)
        const walletSub = WalletService.subscribeToWallet(profile.id, (_update) => {
            unstable_batchedUpdates(() => {
                syncOperationalState();
                addLogEntry('delivered', 'Financial ledger updated');
            });
        });

        return () => {
            console.log('[Realtime] Severing operational uplink...');
            missionSub.unsubscribe();
            walletSub.unsubscribe();
        };
    }, [profile?.id, isShiftActive, isOnline, !!activeOrder]);
};
