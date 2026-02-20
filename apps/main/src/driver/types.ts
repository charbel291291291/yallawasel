import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/types";

export interface DriverProfile extends User {
    vehicle_type?: string;
    vehicle_plate?: string;
    is_online?: boolean;
    driver_status?: "online" | "busy" | "offline";
    rating?: number;
    total_deliveries?: number;
    acceptance_rate?: number;
    avatar_url?: string;
    currency?: string;
}

export interface DriverSession {
    user: SupabaseUser;
    role: string;
    profile?: DriverProfile;
}
