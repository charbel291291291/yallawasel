import { supabase } from './supabaseClient';
import { Order } from '../types';

export const MissionService = {
    /**
     * Fetch open assignments in the driver's current vicinity
     */
    async getAvailableMissions(): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'assigned')
            .eq('expired', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[MissionService] Fetch failed:', error.message);
            return [];
        }
        return data as Order[];
    },

    /**
     * Atomically accept a mission to prevent race conditions
     */
    async acceptMission(orderId: string, driverId: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('accept_order', {
            p_order_id: orderId,
            p_driver_id: driverId
        });

        if (error) {
            console.error('[MissionService] Acceptance failed:', error.message);
            return false;
        }
        return data === true;
    },

    /**
     * Update mission status phase (picked_up, delivering, etc.)
     */
    async updateMissionStatus(orderId: string, status: Order['status']): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        if (error) {
            console.error('[MissionService] Status update failed:', error.message);
            throw error;
        }
    },

    /**
     * Finalize mission with atomic payout logic
     */
    async completeMission(orderId: string, driverId: string, payoutBase: number, payoutBonus: number, surge: number): Promise<void> {
        const { error } = await supabase.rpc('complete_mission_with_payout', {
            p_order_id: orderId,
            p_driver_id: driverId,
            p_base_payout: payoutBase,
            p_bonus_payout: payoutBonus,
            p_surge_multiplier: surge
        });

        if (error) {
            console.error('[MissionService] Completion failed:', error.message);
            throw error;
        }
    },

    /**
     * Subscribe to incoming assignments
     */
    subscribeToNewMissions(onNewMission: (order: Order) => void) {
        return supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
                if (payload.new.status === 'assigned') {
                    onNewMission(payload.new as Order);
                }
            })
            .subscribe();
    }
};
