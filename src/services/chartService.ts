
import { supabase } from "./supabaseClient";

export interface ChartSettings {
    id: number;
    primary_color: string;
    positive_color: string;
    negative_color: string;
    background_color: string;
    grid_color: string;
    text_color: string;
    tooltip_bg_color: string;
    line_thickness: number;
    animation_speed: number;
    show_smooth_curves: boolean;
    show_shadow_glow: boolean;
    dark_mode_enabled: boolean;
    rounded_edges: boolean;
    time_range: '1h' | '6h' | '24h' | '7d';
    refresh_interval: number;
    max_data_points: number;
    realtime_enabled: boolean;
    updated_at?: string;
}

export interface LiveOffer {
    id: string;
    title: string;
    current_price: number;
    status: 'active' | 'inactive' | 'sold_out';
    movement: 'up' | 'down' | 'neutral';
    popularity_score: number;
    updated_at: string;
}

export interface LiveOfferHistory {
    id: string;
    offer_id: string;
    price: number;
    recorded_at: string;
}

export const ChartService = {
    // --- Settings ---

    async getSettings(): Promise<ChartSettings | null> {
        try {
            const { data, error } = await supabase
                .from('chart_settings')
                .select('*')
                .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

            if (error) {
                console.warn('Chart settings not found (using defaults):', error.message);
                return null; // Component will use DEFAULT_SETTINGS
            }
            return data;
        } catch (err) {
            console.error('Unexpected error fetching chart settings:', err);
            return null;
        }
    },

    async updateSettings(updates: Partial<ChartSettings>): Promise<boolean> {
        const { error } = await supabase
            .from('chart_settings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', 1); // Singleton row

        if (error) {
            console.error('Error updating chart settings:', error);
            return false;
        }
        return true;
    },

    // --- Live Offers ---

    async getLiveOffers(): Promise<LiveOffer[]> {
        try {
            const { data, error } = await supabase
                .from('live_offers')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.warn('Live offers fetch error:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('Unexpected error fetching live offers:', err);
            return [];
        }
    },

    async getOfferHistory(offerId: string, limit = 50): Promise<LiveOfferHistory[]> {
        const { data, error } = await supabase
            .from('live_offer_history')
            .select('*')
            .eq('offer_id', offerId)
            .order('recorded_at', { ascending: true }) // Charts need chronological order
            .limit(limit);

        if (error) {
            console.error('Error fetching history:', error);
            return [];
        }
        return data || [];
    },

    // --- Admin Actions ---

    async createOffer(offer: Omit<LiveOffer, 'id' | 'updated_at' | 'movement'>): Promise<boolean> {
        const { error } = await supabase
            .from('live_offers')
            .insert(offer);

        if (error) return false;
        return true;
    },

    async updateOfferPrice(id: string, newPrice: number): Promise<boolean> {
        const { error } = await supabase
            .from('live_offers')
            .update({
                current_price: newPrice,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) return false;
        return true;
    }
};
