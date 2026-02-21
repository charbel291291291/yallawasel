import { supabase } from '@/services/supabaseClient';

export const analyticsService = {
    async getFleetKPIs() {
        const { data, error } = await supabase
            .from('fleet_kpis')
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    async getRevenueByDriver() {
        const { data, error } = await supabase
            .rpc('get_fleet_revenue_by_driver');

        if (error) throw error;
        return data;
    },

    async getRevenueByHour() {
        // Ideally use an RPC for this, but for now we fetch recent delivered orders
        const { data, error } = await supabase
            .from('orders')
            .select('total, created_at')
            .eq('status', 'delivered')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;
        return data;
    }
};
