import { supabase } from './supabaseClient';

export interface Order {
    id: string;
    customer_id: string;
    user_id: string;
    driver_id: string | null;
    status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'approved' | 'preparing' | 'out_for_delivery';
    pickup_address: string;
    dropoff_address: string;
    price: number;
    total: number;
    full_name: string;
    phone: string;
    address: string;
    items: any[];
    expires_at: string | null;
    expired: boolean;
    created_at: string;
    updated_at: string;
}

export const OrderService = {
    /**
     * 📡 STEP 4 — SUBSCRIBE TO ORDERS (Pending & Updates)
     * Upgraded for Enterprise Dispatch: Handles expiration and re-assignments.
     */
    subscribeToOrderFeed(onInsert: (order: Order) => void, onChange: (payload: any) => void) {
        const channel = supabase
            .channel('driver-orders-feed')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: 'status=eq.pending'
                },
                (payload) => {
                    onInsert(payload.new as Order);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    onChange(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Fetch current pending orders
     */
    async getPendingOrders(): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * 🛡 STEP 7 — ACCEPT ORDER (Pro Level with RPC)
     * Prevents race conditions.
     */
    async acceptOrder(orderId: string): Promise<Order> {
        const { data, error } = await supabase.rpc('accept_order', {
            order_uuid: orderId
        });

        if (error) {
            if (error.message.includes('already taken') || error.message.includes('exception')) {
                throw new Error('This order has already been accepted by another driver.');
            }
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('Order not found or already taken.');
        }

        return data[0];
    }
};
