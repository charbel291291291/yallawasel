import { supabase } from './supabaseClient';
import type { Order } from '../types';

export type { Order };

export const OrderService = {
    async getPendingOrders(): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'pending')
            .eq('expired', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async acceptOrder(orderId: string): Promise<Order> {
        // Atomic Accept via RPC
        const { data, error } = await supabase
            .rpc('accept_order', {
                order_uuid: orderId
            });

        if (error) {
            // Check for double-accept (custom error in SQL)
            if (error.message.includes('already taken')) {
                throw new Error('This order was already accepted by another driver.');
            }
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('Failed to accept order. It may have expired.');
        }

        return data[0];
    },

    async updateStatus(orderId: string, status: Order['status']): Promise<void> {
        const payload = {
            status,
            updated_at: new Date().toISOString(),
            ...(status === 'delivered' ? { matched_at: new Date().toISOString() } : {})
        };

        const { error } = await supabase
            .from('orders')
            .update(payload)
            .eq('id', orderId);

        if (error) {
            console.warn("[OrderService] Network fail, queuing status transition");
            const { OfflineQueue } = await import('./offlineQueue');
            await OfflineQueue.push('status_update', { id: orderId, update: payload });
        }
    },


    subscribeToOrderFeed(onInsert: (order: Order) => void, onUpdate: (payload: any) => void) {
        const channel = supabase
            .channel('driver-feed')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `status=eq.pending`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    onInsert(payload.new as Order);
                } else {
                    onUpdate(payload);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

};
