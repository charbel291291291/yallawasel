/**
 * PRODUCTION-GRADE SUPABASE DATABASE TYPES (V3)
 * Reflects the consolidated and hardened schema.
 */

export type UserRole = 'customer' | 'admin' | 'driver';
export type DriverStatus = 'online' | 'busy' | 'offline';
export type VehicleType = 'bike' | 'car' | 'van';
export type OrderStatus = 'pending' | 'approved' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'wallet' | 'card';

export interface DbProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    address: string | null;
    wallet_balance: number;
    points: number;
    tier: string;
    role: UserRole;
    is_admin: boolean;
    vehicle_type: VehicleType | null;
    vehicle_plate: string | null;
    is_online: boolean;
    driver_status: DriverStatus;
    rating: number;
    total_deliveries: number;
    acceptance_rate: number;
    created_at: string;
    updated_at: string | null;
}

export interface DbProduct {
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    description_ar: string | null;
    price: number;
    cost: number;
    stock: number;
    category: string | null;
    image: string | null;
    tags: string[] | null;
    is_active: boolean;
    created_at: string;
}

export interface DbOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface DbOrder {
    id: string;
    user_id: string;
    driver_id: string | null;
    full_name: string;
    phone: string;
    address: string;
    total: number;
    delivery_fee: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    delivery_zone: string | null;
    items: DbOrderItem[];
    notes: string | null;
    admin_notes: string | null;
    delivery_proof_url: string | null;
    customer_signature_url: string | null;
    driver_feedback: string | null;
    driver_accepted_at: string | null;
    driver_arrived_at: string | null;
    driver_picked_up_at: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbDriverTransaction {
    id: string;
    driver_id: string;
    order_id: string | null;
    amount: number;
    type: 'commission' | 'tip' | 'payout' | 'adjustment';
    description: string | null;
    created_at: string;
}

export interface DbDriverGoal {
    id: string;
    driver_id: string;
    date: string;
    target_deliveries: number;
    current_deliveries: number;
    target_earnings: number;
    current_earnings: number;
}

export interface DbHappyHour {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    days_of_week: number[] | null;
    multiplier: number;
    bonus_points: number;
    active: boolean;
    created_at: string;
}
