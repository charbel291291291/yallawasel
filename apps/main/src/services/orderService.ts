import { supabase } from './supabaseClient';

export interface Order {
    id: string;
    customer_id: string;
    user_id: string; // compatibility
    driver_id: string | null;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    price: number;
    full_name: string;
    phone: string;
    total: number;
    items: any[];
    created_at: string;
    updated_at: string;
}

export const OrderService = {
    /**
     * ⚡ STEP 3 — CREATE ORDER
     */
    async createOrder(payload: any): Promise<Order> {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                ...payload,
                customer_id: payload.customer_id || payload.user_id, // ensure both are set
                user_id: payload.user_id || payload.customer_id,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 🔄 STEP 6 — SUBSCRIBE TO OWN ORDERS
     */
    subscribeToOrders(userId: string, onUpdate: (order: Order) => void) {
        const channel = supabase
            .channel(`customer-orders-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${userId}`
                },
                (payload) => {
                    onUpdate(payload.new as Order);
                }
            )
            .subscribe();

        const channelFallback = supabase
            .channel(`customer-orders-fallback-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    onUpdate(payload.new as Order);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(channelFallback);
        };
    }
};
