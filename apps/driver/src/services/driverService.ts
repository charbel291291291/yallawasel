import { supabase } from './supabaseClient';

export interface DriverState {
    id: string;
    is_online: boolean;
    last_seen: string;
    lat: number | null;
    lng: number | null;
}

export const DriverService = {
    /**
     * 🟢 2️⃣ HEARTBEAT & STATE MANAGEMENT
     * Updates driver status and geolocation every 20 seconds.
     */
    async updateStatus(userId: string, isOnline: boolean, location?: { lat: number; lng: number }) {
        const payload = {
            id: userId,
            is_online: isOnline,
            last_seen: new Date().toISOString(),
            ...(location && { lat: location.lat, lng: location.lng }),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('drivers')
            .upsert(payload);

        if (error) console.error("[DriverService] Heartbeat failed:", error);
    },

    /**
     * Start the heartbeat loop
     */
    startHeartbeat(userId: string, intervalMs: number = 20000) {
        let isRunning = true;

        const tick = async () => {
            if (!isRunning) return;

            let location = undefined;
            try {
                if ('geolocation' in navigator) {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
                    );
                    location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                }
            } catch (err) {
                console.warn("[DriverService] Could not get location:", err);
            }

            await this.updateStatus(userId, true, location);

            if (isRunning) {
                setTimeout(tick, intervalMs);
            }
        };

        tick();

        return () => {
            isRunning = false;
            // Set offline on cleanup
            this.updateStatus(userId, false);
        };
    }
};
