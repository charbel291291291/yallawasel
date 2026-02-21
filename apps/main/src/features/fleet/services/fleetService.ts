import { supabase } from '@/services/supabaseClient';

export const fleetService = {
    async getDrivers() {
        const { data, error } = await supabase
            .from('drivers')
            .select(`
        *,
        profile:profiles(full_name, avatar_url)
      `)
            .order('last_seen', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getActiveMissions() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        driver:profiles!orders_driver_id_fkey(full_name),
        customer:profiles!orders_customer_id_fkey(full_name)
      `)
            .in('status', ['assigned', 'accepted', 'picked_up'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async updateSurge(zoneId: string, multiplier: number, durationMinutes: number) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

        const { error } = await supabase
            .from('demand_zones')
            .update({
                surge_multiplier: multiplier,
                updated_at: new Date().toISOString()
            })
            .eq('id', zoneId);

        if (error) throw error;
    },

    async disableSurge(zoneId: string) {
        const { error } = await supabase
            .from('demand_zones')
            .update({
                surge_multiplier: 1.0,
                updated_at: new Date().toISOString()
            })
            .eq('id', zoneId);

        if (error) throw error;
    }
};
