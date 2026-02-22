export type UserRole = 'customer' | 'driver' | 'admin' | 'fleet_manager';

export enum UserTier {
    BRONZE = "Bronze",
    SILVER = "Silver",
    GOLD = "Gold",
    ELITE = "Elite",
}

export interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    role: UserRole;
    points: number;
    wallet_balance?: number;
    tier: UserTier | string;
    status?: 'active' | 'blocked' | 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export type OrderStatus =
    | "pending"
    | "approved"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "assigned"
    | "accepted"
    | "picked_up"
    | "delivering";

export interface SharedOrder {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    address: string;
    total: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
    payment_method: string;
    notes?: string;
    driver_id?: string;
}
