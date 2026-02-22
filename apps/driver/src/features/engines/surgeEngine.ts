import { supabase } from '../services/supabaseClient';

/**
 * PRODUCTION SURGE ENGINE
 * Connects to live demand zones and calculates psychological pricing intensity.
 */
export const SurgeEngine = {
    /**
     * Get live surge data for a specific location
     */
    async getLocalSurge(_lat: number, _lng: number): Promise<{ multiplier: number; heat: 'low' | 'medium' | 'high' }> {
        // In a full implementation, we would use PostGIS st_contains here.
        // For now, we fetch the global highest surge as a safe fallback.
        const { data, error } = await supabase
            .from('demand_zones')
            .select('surge_multiplier, heat_level')
            .order('surge_multiplier', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return { multiplier: 1.0, heat: 'low' };
        }

        return {
            multiplier: Number(data.surge_multiplier),
            heat: data.heat_level as 'low' | 'medium' | 'high'
        };
    }
};
