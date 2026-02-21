export type UserRole = 'customer' | 'driver' | 'admin';
export type DriverTier = 'Bronze' | 'Silver' | 'Gold';
export type AppLanguage = 'en' | 'ar';

export interface Profile {
    id: string;
    full_name: string | null;
    phone: string | null;
    address: string | null;
    role: UserRole;
    points: number;
    verified: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    onboarding_completed?: boolean;
    language_pref?: AppLanguage;
    tier?: DriverTier;
}

export type DriverTerminalStatus = 'OFFLINE' | 'IDLE' | 'ORDER_ASSIGNED' | 'PICKED_UP' | 'DELIVERING' | 'MISSION_ACTIVE' | 'ONBOARDING';

export interface DriverStats {
    id: string;
    is_online: boolean;
    last_seen: string;
    lat: number | null;
    lng: number | null;
    speed_score: number;
    acceptance_rate: number;
    completion_rate: number;
    total_accepted: number;
    daily_earnings: number;
    weekly_earnings: number;
    average_rating: number;
    completed_deliveries: number;
    current_streak: number;
    shift_start_time: string | null;
    shift_earnings: number;
    shift_missions: number;
}

export interface WalletTransaction {
    id: string;
    order_id?: string;
    amount: number;
    type: 'payout' | 'bonus' | 'withdrawal';
    description: string;
    timestamp: string;
    surge_bonus?: number;
    streak_bonus?: number;
}

export interface WalletState {
    balance: number;
    today_earnings: number;
    pending_payouts: number;
    transactions: WalletTransaction[];
}

export interface Order {
    id: string;
    status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';
    payout_base: number;
    payout_bonus: number;
    surge_multiplier: number;
    pickup_address: string | null;
    dropoff_address: string | null;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
    customer_name?: string;
    customer_phone?: string;
    address?: string | null;
    expires_at: string | null;
    expired: boolean;
    boost_level: number;
    created_at: string;
    seconds_remaining?: number;
}

export interface ActivityLogEntry {
    id: string;
    type: 'accept' | 'reject' | 'delivered' | 'online' | 'offline' | 'connection_lost' | 'connection_restored' | 'shift_start' | 'shift_end' | 'onboarding';
    message: string;
    timestamp: string;
}

export interface QueuedOperation {
    id: string;
    type: 'accept_order' | 'status_update' | 'location_update';
    payload: any;
    timestamp: number;
    retryCount: number;
}
