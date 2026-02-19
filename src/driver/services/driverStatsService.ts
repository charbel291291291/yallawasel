import { supabase } from "@/services/supabaseClient";

interface DailyStats {
    earnings: number;
    deliveries: number;
    goal: { target_deliveries: number; target_earnings: number };
}

export const getDailyStats = async (driverId: string): Promise<DailyStats> => {
    const today = new Date().toISOString().split("T")[0];
    const defaults: DailyStats = {
        earnings: 0,
        deliveries: 0,
        goal: { target_deliveries: 10, target_earnings: 100 },
    };

    try {
        // Fetch Earnings
        const { data: earningsData } = await supabase
            .from("driver_transactions")
            .select("amount")
            .eq("driver_id", driverId)
            .gte("created_at", `${today}T00:00:00.000Z`)
            .lte("created_at", `${today}T23:59:59.999Z`);

        const todaysEarnings = earningsData?.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0;

        // Fetch Deliveries Count
        const { count: todaysDeliveries } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("driver_id", driverId)
            .eq("status", "delivered")
            .gte("updated_at", `${today}T00:00:00.000Z`)
            .lte("updated_at", `${today}T23:59:59.999Z`);

        // Fetch Goal
        const { data: goalData } = await supabase
            .from("driver_goals")
            .select("target_deliveries, target_earnings")
            .eq("driver_id", driverId)
            .eq("date", today)
            .single();

        return {
            earnings: todaysEarnings,
            deliveries: todaysDeliveries ?? 0,
            goal: goalData ?? defaults.goal,
        };
    } catch {
        return defaults;
    }
};

export const getDriverAchievements = async (driverId: string) => {
    try {
        const { data } = await supabase
            .from("driver_achievements")
            .select("*")
            .eq("driver_id", driverId);
        return data ?? [];
    } catch {
        return [];
    }
};
