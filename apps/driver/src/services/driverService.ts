import { supabase } from './supabaseClient';
import { DriverStats } from '../types';

export const DriverService = {
    /**
     * Fetch current driver stats for the leaderboard/dashboard
     */
    async getDriverStats(userId: string): Promise<DriverStats | null> {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;
        return data as DriverStats;
    },

    /**
     * 🟢 HEARTBEAT & STATE MANAGEMENT
     * Updates driver status and geolocation.
     */
    async updateStatus(userId: string, isOnline: boolean, location?: { lat: number; lng: number }) {
        const payload = {
            id: userId,
            is_online: isOnline,
            last_seen: new Date().toISOString(),
            ...(location && { lat: location.lat || null, lng: location.lng || null }),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('drivers')
            .upsert(payload);

        if (error) {
            console.warn("[DriverService] Telemetry sync failed:", error.message);
        }
    },

    /**
     * Initialize the heartbeat link
     */
    startHeartbeat(userId: string, onUpdate: (isOnline: boolean) => void, intervalMs: number = 20000) {
        console.log("[DriverService] Heartbeat link established");

        const interval = setInterval(async () => {
            // In a real app, we'd get actual GPS here
            await this.updateStatus(userId, true);
        }, intervalMs);

        return () => {
            console.log("[DriverService] Heartbeat link severed");
            clearInterval(interval);
        };
    }
};
