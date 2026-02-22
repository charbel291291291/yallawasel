import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Profile,
    DriverStats,
    Order,
    DriverTerminalStatus,
    ActivityLogEntry,
    AppLanguage,
    DriverTier,
    WalletState,
    WalletTransaction
} from '../types';
import { MissionService } from '../services/missionService';
import { WalletService } from '../services/walletService';
import { DriverService } from '../services/driverService';
import { TierEngine } from '../features/engines/tierEngine';
import { SurgeEngine } from '../features/engines/surgeEngine';

interface DriverState {
    // Auth & Identity
    profile: Profile | null;
    sessionLoading: boolean;
    onboardingCompleted: boolean;
    language: AppLanguage;
    tier: DriverTier;

    // Terminal Operational State
    status: DriverTerminalStatus;
    isOnline: boolean;
    activeOrder: Order | null;
    incomingOrders: Order[];
    driverStats: DriverStats | null;

    // Shift State
    isShiftActive: boolean;
    shiftStartTime: number | null;
    shiftEarnings: number;
    shiftMissions: number;
    currentStreak: number;

    // Wallet
    wallet: WalletState;

    // Environmental
    surgeMultiplier: number;
    heatLevel: 'low' | 'medium' | 'high';

    // Activity Log
    logs: ActivityLogEntry[];

    // Live Metrics
    location: { lat: number; lng: number } | null;
    connectionStatus: 'stable' | 'weak' | 'offline';
    lastSyncAt: number;

    // Investor/Demo Mode
    INVESTOR_MODE: boolean;

    // Actions
    setProfile: (profile: Profile | null) => void;
    setSessionLoading: (loading: boolean) => void;
    setLanguage: (lang: AppLanguage) => void;
    completeOnboarding: () => void;
    setInvestorMode: (enabled: boolean) => void;

    // Shift Actions
    startShift: () => Promise<void>;
    endShift: () => Promise<void>;

    // Core Actions
    goOnline: () => Promise<void>;
    goOffline: () => Promise<void>;

    acceptOrder: (order: Order) => Promise<boolean>;
    declineOrder: (orderId: string, reason?: string) => void;
    updateOrderStatus: (status: Order['status']) => Promise<void>;
    completeOrder: () => Promise<void>;

    // Sync Actions
    syncOperationalState: () => Promise<void>;
    setIncomingOrders: (orders: Order[]) => void;
    setDriverStats: (stats: DriverStats | null) => void;
    setLocation: (location: { lat: number; lng: number } | null) => void;
    setConnectionStatus: (status: 'stable' | 'weak' | 'offline') => void;

    // Wallet Actions
    addTransaction: (tx: Omit<WalletTransaction, 'id' | 'timestamp'>) => void;
    addLogEntry: (type: ActivityLogEntry['type'], message: string) => void;
    resetStore: () => void;
}

const initialState = {
    profile: null,
    sessionLoading: true,
    onboardingCompleted: false,
    language: 'en' as AppLanguage,
    tier: 'Bronze' as DriverTier,
    status: 'OFFLINE' as DriverTerminalStatus,
    isOnline: false,
    activeOrder: null,
    incomingOrders: [],
    driverStats: null,
    isShiftActive: false,
    shiftStartTime: null,
    shiftEarnings: 0,
    shiftMissions: 0,
    currentStreak: 0,
    wallet: {
        balance: 0,
        today_earnings: 0,
        pending_payouts: 0,
        transactions: []
    },
    surgeMultiplier: 1.0,
    heatLevel: 'low' as 'low' | 'medium' | 'high',
    logs: [],
    location: null,
    connectionStatus: 'stable' as 'stable' | 'weak' | 'offline',
    lastSyncAt: Date.now(),
    INVESTOR_MODE: false,
};

export const useDriverStore = create<DriverState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setProfile: (profile) => {
                set({
                    profile,
                    onboardingCompleted: profile?.onboarding_completed ?? false,
                    language: profile?.language_pref ?? 'en',
                    tier: profile?.tier ?? 'Bronze'
                });
                if (profile) get().syncOperationalState();
            },

            setSessionLoading: (loading) => set({ sessionLoading: loading }),
            setLanguage: (language) => set({ language }),
            setInvestorMode: (enabled) => set({ INVESTOR_MODE: enabled }),

            completeOnboarding: () => set((state) => ({
                onboardingCompleted: true,
                status: state.status === 'ONBOARDING' ? 'OFFLINE' : state.status
            })),

            syncOperationalState: async () => {
                const { profile } = get();
                if (!profile) return;

                try {
                    const [stats, wallet, surge] = await Promise.all([
                        DriverService.getDriverStats(profile.id),
                        WalletService.getWalletState(profile.id),
                        SurgeEngine.getLocalSurge(0, 0)
                    ]);

                    set({
                        driverStats: stats,
                        wallet: wallet || get().wallet,
                        surgeMultiplier: surge.multiplier,
                        heatLevel: surge.heat,
                        tier: stats ? TierEngine.calculateTier(stats) : get().tier,
                        connectionStatus: 'stable',
                        lastSyncAt: Date.now()
                    });
                } catch (e) {
                    set({ connectionStatus: 'weak' });
                }
            },

            startShift: async () => {
                const { profile, INVESTOR_MODE } = get();
                if (!profile && !INVESTOR_MODE) return;

                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'shift_start',
                    message: 'Operational Shift Initiated',
                    timestamp: new Date().toISOString()
                };

                set({
                    isShiftActive: true,
                    shiftStartTime: Date.now(),
                    shiftEarnings: 0,
                    shiftMissions: 0,
                    currentStreak: 0,
                    logs: [entry, ...get().logs].slice(0, 10)
                });
            },

            endShift: async () => {
                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'shift_end',
                    message: `Shift terminated: ${get().shiftMissions} missions completed`,
                    timestamp: new Date().toISOString()
                };

                set({
                    isShiftActive: false,
                    isOnline: false,
                    status: 'OFFLINE',
                    activeOrder: null,
                    logs: [entry, ...get().logs].slice(0, 10)
                });
            },

            goOnline: async () => {
                const { profile, INVESTOR_MODE } = get();
                if (profile) await DriverService.updateStatus(profile.id, true);

                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'online',
                    message: 'Operator status: LIVE',
                    timestamp: new Date().toISOString()
                };

                set({
                    isOnline: true,
                    status: 'IDLE',
                    logs: [entry, ...get().logs].slice(0, 10)
                });

                if (!INVESTOR_MODE) {
                    const missions = await MissionService.getAvailableMissions();
                    set({ incomingOrders: missions });
                }
            },

            goOffline: async () => {
                const { profile } = get();
                if (profile) await DriverService.updateStatus(profile.id, false);

                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'offline',
                    message: 'Operator status: STANDBY',
                    timestamp: new Date().toISOString()
                };

                set({
                    isOnline: false,
                    status: 'OFFLINE',
                    activeOrder: null,
                    logs: [entry, ...get().logs].slice(0, 10)
                });
            },

            acceptOrder: async (order) => {
                const { profile, INVESTOR_MODE } = get();

                if (!INVESTOR_MODE && profile) {
                    const success = await MissionService.acceptMission(order.id, profile.id);
                    if (!success) return false;
                }

                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'accept',
                    message: `Mission accepted: #${order.id.slice(0, 8)}`,
                    timestamp: new Date().toISOString()
                };

                set({
                    activeOrder: { ...order, status: 'accepted' },
                    status: 'MISSION_ACTIVE',
                    incomingOrders: [],
                    logs: [entry, ...get().logs].slice(0, 10)
                });

                if ('vibrate' in navigator) navigator.vibrate(100);
                return true;
            },

            declineOrder: (orderId, reason) => {
                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'reject',
                    message: `Mission declined: #${orderId.slice(0, 8)}${reason ? ` (${reason})` : ''}`,
                    timestamp: new Date().toISOString()
                };

                set((state) => ({
                    incomingOrders: state.incomingOrders.filter(o => o.id !== orderId),
                    logs: [entry, ...state.logs].slice(0, 10)
                }));
            },

            updateOrderStatus: async (status) => {
                const { activeOrder, INVESTOR_MODE } = get();
                if (!activeOrder) return;

                if (!INVESTOR_MODE) {
                    await MissionService.updateMissionStatus(activeOrder.id, status);
                }

                let terminalStatus: DriverTerminalStatus = get().status;
                if (status === 'picked_up') terminalStatus = 'PICKED_UP';
                if (status === 'delivering') terminalStatus = 'MISSION_ACTIVE';

                set({
                    activeOrder: { ...activeOrder, status },
                    status: terminalStatus
                });
            },

            completeOrder: async () => {
                const { activeOrder, profile, INVESTOR_MODE, surgeMultiplier } = get();
                if (!activeOrder) return;

                const earnings = activeOrder.payout_base * surgeMultiplier + activeOrder.payout_bonus;

                if (!INVESTOR_MODE && profile) {
                    await MissionService.completeMission(
                        activeOrder.id,
                        profile.id,
                        activeOrder.payout_base,
                        activeOrder.payout_bonus,
                        surgeMultiplier
                    );
                    await get().syncOperationalState();
                } else {
                    set((state) => ({
                        shiftEarnings: state.shiftEarnings + earnings,
                        shiftMissions: state.shiftMissions + 1,
                        currentStreak: state.currentStreak + 1,
                        wallet: {
                            ...state.wallet,
                            balance: state.wallet.balance + earnings,
                            today_earnings: state.wallet.today_earnings + earnings
                        }
                    }));
                }

                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'delivered',
                    message: `Mission success: +$${earnings.toFixed(2)}`,
                    timestamp: new Date().toISOString()
                };

                set({
                    activeOrder: null,
                    status: 'IDLE',
                    logs: [entry, ...get().logs].slice(0, 10)
                });
            },

            setIncomingOrders: (orders) => set({ incomingOrders: orders }),
            setDriverStats: (stats) => set({ driverStats: stats }),
            setLocation: (location) => set({ location }),
            setConnectionStatus: (status) => set({ connectionStatus: status }),

            addTransaction: (tx) => {
                const { profile } = get();
                if (profile && tx.type === 'withdrawal') {
                    WalletService.requestWithdrawal(profile.id, tx.amount);
                    get().syncOperationalState();
                }
            },

            addLogEntry: (type, message) => {
                const entry: ActivityLogEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    type,
                    message,
                    timestamp: new Date().toISOString()
                };
                set((state) => ({
                    logs: [entry, ...state.logs].slice(0, 10)
                }));
            },

            resetStore: () => set(initialState),
        }),
        {
            name: 'yalla-wasel-driver-storage',
            partialize: (state) => ({
                onboardingCompleted: state.onboardingCompleted,
                language: state.language,
                wallet: state.wallet,
                tier: state.tier,
                INVESTOR_MODE: state.INVESTOR_MODE
            })
        }
    )
);
