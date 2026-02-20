// import { Product, Order, UserTier, OrderStatus, CartItem } from "../types";

/** Admin order row from Supabase */
export interface AdminOrder {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    address: string;
    total: number;
    delivery_fee: number;
    status: string;
    payment_method: string;
    delivery_zone: string;
    items: AdminOrderItem[];
    admin_notes?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
    profiles?: { full_name?: string; phone?: string; email?: string };
}

export interface AdminOrderItem {
    image?: string;
    name?: string;
    price?: number;
    quantity?: number;
}

export interface OrderStatusHistoryEntry {
    id: string;
    order_id: string;
    status: string;
    note?: string;
    created_by?: string;
    created_at: string;
}

/** Admin customer row from Supabase */
export interface AdminCustomer {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    points: number;
    tier: string;
    wallet_balance: number;
    is_admin: boolean;
    created_at: string;
    total_spent?: number;
    visits_count?: number;
}

export interface PointsTransaction {
    id: string;
    user_id: string;
    customer_id?: string; // Some parts of code use customer_id
    amount: number;
    type: string;
    description?: string;
    note?: string; // Some parts of code use note
    created_at: string;
    profiles?: { full_name: string };
    points?: number; // Some parts of code use .points instead of .amount
}

/** Admin reward row from Supabase */
export interface AdminReward {
    id: string;
    title: string;
    description?: string;
    points_required: number;
    reward_type: string;
    value?: number;
    stock_limit?: number | null;
    is_active: boolean;
    active?: boolean; // Some code uses .active
    expires_at?: string;
    created_at: string;
}

export interface AdminRedemption {
    id: string;
    user_id: string;
    customer_id?: string; // Some parts of code use customer_id
    reward_id: string;
    status: string;
    points_spent: number;
    created_at: string;
    profiles?: { full_name: string; email?: string };
    rewards?: { title: string; reward_type: string; points_required?: number };
}

/** Admin happy hour row from Supabase */
export interface AdminHappyHour {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    days_of_week?: number[];
    multiplier?: number;
    bonus_points?: number;
    active: boolean;
    created_at: string;
}

/** Admin impact campaign row from Supabase */
export interface AdminImpactCampaign {
    id: string;
    title: string;
    description?: string;
    goal_type: string;
    goal_amount: number;
    current_amount: number;
    impact_per_dollar: number;
    is_active: boolean;
    show_on_impact_page: boolean;
    image_url?: string;
    created_at: string;
}

export interface AdminLeaderboardEntry {
    user_id?: string;
    full_name?: string;
    total_impact?: number;
    contributions?: number;
    rank?: number; // Added for UI consumption
    name?: string; // Added for UI consumption
    impact?: number; // Added for UI consumption
}

/** Form data for impact campaign creation/editing */
export interface ImpactCampaignFormData {
    title: string;
    description: string;
    goal_type: string;
    goal_amount: number;
    impact_per_dollar: number;
    show_on_impact_page: boolean;
    image_url: string;
    [key: string]: string | number | boolean;
}

export type AdminTab =
    | "dashboard"
    | "orders"
    | "products"
    | "kit_builder"
    | "customers"
    | "rewards"
    | "happyhour"
    | "impact"
    | "chart_settings"
    | "settings";
