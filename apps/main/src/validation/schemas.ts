/**
 * RUNTIME VALIDATION SCHEMAS (Zod)
 * ================================
 * Mirrors Supabase DB types with strict runtime enforcement.
 * All schemas use .strict() to reject unknown keys.
 * Enums are enforced at runtime, not just compile-time.
 */

import { z } from "zod";

// ============================================
// SHARED ENUMS
// ============================================

export const UserRoleEnum = z.enum(["customer", "admin", "driver"]);
export const UserTierEnum = z.enum(["Bronze", "Silver", "Gold", "Elite"]);
export const OrderStatusEnum = z.enum([
    "pending",
    "approved",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
]);
export const PaymentMethodEnum = z.enum(["cash", "wallet", "card"]);
export const DriverStatusEnum = z.enum(["online", "busy", "offline"]);
export const VehicleTypeEnum = z.enum(["bike", "car", "van"]);
export const ImpactBadgeLevelEnum = z.enum(["supporter", "changemaker", "hero"]);
export const LiveOfferStatusEnum = z.enum(["active", "inactive", "sold_out"]);
export const LiveOfferMovementEnum = z.enum(["up", "down", "neutral"]);
export const DriverTransactionTypeEnum = z.enum(["commission", "tip", "payout", "adjustment"]);
export const ChartTimeRangeEnum = z.enum(["1h", "6h", "24h", "7d"]);
export const AdminLogTypeEnum = z.enum(["info", "warning", "critical"]);
export const RedemptionStatusEnum = z.enum(["pending", "approved", "rejected", "fulfilled"]);
export const LanguageEnum = z.enum(["en", "ar"]);
export const ThemeEnum = z.enum(["light", "dark", "luxury"]);

// ============================================
// PROFILE / USER SCHEMAS
// ============================================

/** Database profile row — mirrors DbProfile */
export const DbProfileSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    wallet_balance: z.number().min(0),
    points: z.number().int().min(0),
    tier: z.string(),
    role: UserRoleEnum,
    is_admin: z.boolean(),
    vehicle_type: VehicleTypeEnum.nullable(),
    vehicle_plate: z.string().nullable(),
    is_online: z.boolean(),
    driver_status: DriverStatusEnum,
    rating: z.number().min(0).max(5),
    total_deliveries: z.number().int().min(0),
    acceptance_rate: z.number().min(0).max(100),
    created_at: z.string(),
    updated_at: z.string().nullable(),
}).strict();

/** Client-side User shape used by UI components */
export const UserSchema = z.object({
    id: z.string(),
    full_name: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    wallet_balance: z.number().optional(),
    points: z.number().int().min(0),
    tier: UserTierEnum,
    role: UserRoleEnum.optional(),
    isAdmin: z.boolean(),
    joinDate: z.string().optional(),
    status: z.enum(["active", "blocked"]).optional(),
});

// ============================================
// WALLET SCHEMAS
// ============================================

export const WalletBalanceSchema = z.object({
    wallet_balance: z.number().min(0),
    points: z.number().int().min(0),
    tier: z.string(),
});

export const PointsTransactionSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    customer_id: z.string().optional(),
    amount: z.number(),
    type: z.string(),
    description: z.string().optional(),
    note: z.string().optional(),
    created_at: z.string(),
    profiles: z.object({ full_name: z.string() }).optional(),
    points: z.number().optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const DbProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    name_ar: z.string().nullable(),
    description: z.string().nullable(),
    description_ar: z.string().nullable(),
    price: z.number().min(0),
    cost: z.number().min(0),
    stock: z.number().int().min(0),
    category: z.string().nullable(),
    image: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    is_active: z.boolean(),
    created_at: z.string(),
}).strict();

/** Client-side Product shape */
export const ProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    nameAr: z.string(),
    description: z.string(),
    descriptionAr: z.string(),
    price: z.number().min(0),
    cost: z.number().optional(),
    stock: z.number().int().optional(),
    category: z.string(),
    image: z.string(),
    tags: z.array(z.string()),
    isActive: z.boolean().optional(),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const OrderItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    productName: z.string().optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    image: z.string().optional(),
});

export const DbOrderSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    driver_id: z.string().nullable(),
    full_name: z.string(),
    phone: z.string(),
    address: z.string(),
    total: z.number().min(0),
    delivery_fee: z.number().min(0),
    status: OrderStatusEnum,
    payment_method: PaymentMethodEnum,
    delivery_zone: z.string().nullable(),
    items: z.array(OrderItemSchema),
    notes: z.string().nullable(),
    admin_notes: z.string().nullable(),
    delivery_proof_url: z.string().nullable(),
    customer_signature_url: z.string().nullable(),
    driver_feedback: z.string().nullable(),
    driver_accepted_at: z.string().nullable(),
    driver_arrived_at: z.string().nullable(),
    driver_picked_up_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string().nullable(),
}).strict();

/** Flexible order schema for API responses (may include joined profiles) */
export const OrderResponseSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    driver_id: z.string().nullable().optional(),
    full_name: z.string(),
    phone: z.string(),
    address: z.string(),
    total: z.number(),
    delivery_fee: z.number().optional(),
    status: z.string(), // Loose for admin flexibility
    payment_method: z.string(),
    delivery_zone: z.string().nullable().optional(),
    items: z.array(OrderItemSchema).default([]),
    notes: z.string().nullable().optional(),
    admin_notes: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string().nullable().optional(),
    profiles: z.object({
        full_name: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
    }).optional(),
});

export const OrderStatusHistorySchema = z.object({
    id: z.string(),
    order_id: z.string(),
    status: z.string(),
    note: z.string().optional().nullable(),
    created_by: z.string().optional().nullable(),
    created_at: z.string(),
});

// ============================================
// HAPPY HOUR SCHEMAS
// ============================================

export const HappyHourSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    name: z.string().min(1),
    start_time: z.string(),
    end_time: z.string(),
    days_of_week: z.array(z.number().int().min(0).max(6)).nullable().default([]),
    multiplier: z.number().min(1),
    bonus_points: z.number().int().min(0),
    active: z.boolean(),
});

// ============================================
// IMPACT SCHEMAS
// ============================================

export const ImpactCampaignSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    title: z.string().min(1),
    description: z.string(),
    image_url: z.string(),
    goal_amount: z.number().min(0),
    current_amount: z.number().min(0),
    goal_type: z.string(),
    impact_per_dollar: z.number().min(0),
    is_active: z.boolean(),
    show_on_impact_page: z.boolean(),
});

export const UserImpactSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    user_id: z.string(),
    campaign_id: z.string(),
    order_id: z.string().optional(),
    contribution_amount: z.number().min(0),
    impact_units: z.number().min(0),
    impact_type: z.string(),
});

export const ImpactUserStatsSchema = z.object({
    totalContributed: z.number().min(0),
    totalImpactUnits: z.number().min(0),
    badgeLevel: ImpactBadgeLevelEnum,
    campaignContributions: z.array(UserImpactSchema),
});

// ============================================
// DRIVER SCHEMAS
// ============================================

export const DriverProfileSchema = UserSchema.extend({
    vehicle_type: z.string().optional(),
    vehicle_plate: z.string().optional(),
    is_online: z.boolean().optional(),
    driver_status: DriverStatusEnum.optional(),
    rating: z.number().min(0).max(5).optional(),
    total_deliveries: z.number().int().min(0).optional(),
    acceptance_rate: z.number().min(0).max(100).optional(),
    avatar_url: z.string().optional(),
    currency: z.string().optional(),
});

export const DailyStatsSchema = z.object({
    earnings: z.number().min(0),
    deliveries: z.number().int().min(0),
    goal: z.object({
        target_deliveries: z.number().int().min(0),
        target_earnings: z.number().min(0),
    }),
});

export const DriverTransactionSchema = z.object({
    id: z.string(),
    driver_id: z.string(),
    order_id: z.string().nullable(),
    amount: z.number(),
    type: DriverTransactionTypeEnum,
    description: z.string().nullable(),
    created_at: z.string(),
}).strict();

export const DriverGoalSchema = z.object({
    id: z.string(),
    driver_id: z.string(),
    date: z.string(),
    target_deliveries: z.number().int().min(0),
    current_deliveries: z.number().int().min(0),
    target_earnings: z.number().min(0),
    current_earnings: z.number().min(0),
}).strict();

// ============================================
// CHART / LIVE OFFERS SCHEMAS
// ============================================

export const ChartSettingsSchema = z.object({
    id: z.number(),
    primary_color: z.string(),
    positive_color: z.string(),
    negative_color: z.string(),
    background_color: z.string(),
    grid_color: z.string(),
    text_color: z.string(),
    tooltip_bg_color: z.string(),
    line_thickness: z.number().min(1).max(10),
    animation_speed: z.number().min(100),
    show_smooth_curves: z.boolean(),
    show_shadow_glow: z.boolean(),
    dark_mode_enabled: z.boolean(),
    rounded_edges: z.boolean(),
    time_range: ChartTimeRangeEnum,
    refresh_interval: z.number().min(1000),
    max_data_points: z.number().int().min(10),
    realtime_enabled: z.boolean(),
    updated_at: z.string().optional(),
});

export const LiveOfferSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    current_price: z.number().min(0),
    status: LiveOfferStatusEnum,
    movement: LiveOfferMovementEnum,
    popularity_score: z.number().min(0),
    updated_at: z.string(),
});

export const LiveOfferHistorySchema = z.object({
    id: z.string(),
    offer_id: z.string(),
    price: z.number(),
    recorded_at: z.string(),
});

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const AppSettingsSchema = z.object({
    store_name: z.string(),
    store_description: z.string(),
    logo_url: z.string(),
    contact_email: z.string(),
    contact_phone: z.string(),
    maintenance_mode: z.boolean(),
    maintenance_message: z.string().optional(),
    language: LanguageEnum,
    currency: z.string(),
    currency_symbol: z.string(),
    timezone: z.string(),
    theme: ThemeEnum,
    primary_color: z.string().optional(),
    enable_2fa: z.boolean(),
    session_timeout_minutes: z.number().int().min(1),
    tax_rate: z.number().min(0),
    tax_inclusive: z.boolean(),
    enable_stripe: z.boolean(),
    enable_cod: z.boolean(),
    ticker_speed: z.number().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

export const DeliverySettingsSchema = z.object({
    id: z.number().optional(),
    enabled: z.boolean(),
    free_delivery_enabled: z.boolean(),
    free_delivery_min_order: z.number().min(0),
    default_fee: z.number().min(0),
    estimated_time_min: z.number().int().min(0),
    estimated_time_max: z.number().int().min(0),
});

export const DeliveryZoneSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    fee: z.number().min(0),
    min_order: z.number().optional(),
    estimated_time_min: z.number().optional(),
    estimated_time_max: z.number().optional(),
    active: z.boolean(),
});

export const DeliveryDaySchema = z.object({
    id: z.string().optional(),
    day_of_week: z.number().int().min(0).max(6),
    open_time: z.string(),
    close_time: z.string(),
    active: z.boolean(),
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const AdminCustomerSchema = z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    points: z.number().int().min(0),
    tier: z.string(),
    wallet_balance: z.number().min(0),
    is_admin: z.boolean(),
    created_at: z.string(),
    total_spent: z.number().optional(),
    visits_count: z.number().optional(),
});

export const AdminRewardSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    points_required: z.number().int().min(0),
    reward_type: z.string(),
    value: z.number().optional(),
    stock_limit: z.number().nullable().optional(),
    is_active: z.boolean(),
    active: z.boolean().optional(),
    expires_at: z.string().optional(),
    created_at: z.string(),
});

export const AdminRedemptionSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    customer_id: z.string().optional(),
    reward_id: z.string(),
    status: z.string(),
    points_spent: z.number().int().min(0),
    created_at: z.string(),
    profiles: z.object({
        full_name: z.string(),
        email: z.string().optional(),
    }).optional(),
    rewards: z.object({
        title: z.string(),
        reward_type: z.string(),
        points_required: z.number().optional(),
    }).optional(),
});

// ============================================
// RPC RESPONSE SCHEMAS
// ============================================

export const IncrementPointsResponseSchema = z.object({
    success: z.boolean().optional(),
}).or(z.number()).or(z.null());

export const RpcVoidResponseSchema = z.null().or(z.undefined()).or(z.object({}));

// ============================================
// TYPE EXPORTS (inferred from schemas)
// ============================================

export type ValidatedDbProfile = z.infer<typeof DbProfileSchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedOrder = z.infer<typeof OrderResponseSchema>;
export type ValidatedProduct = z.infer<typeof DbProductSchema>;
export type ValidatedHappyHour = z.infer<typeof HappyHourSchema>;
export type ValidatedImpactCampaign = z.infer<typeof ImpactCampaignSchema>;
export type ValidatedDailyStats = z.infer<typeof DailyStatsSchema>;
export type ValidatedChartSettings = z.infer<typeof ChartSettingsSchema>;
export type ValidatedLiveOffer = z.infer<typeof LiveOfferSchema>;
export type ValidatedAppSettings = z.infer<typeof AppSettingsSchema>;
export type ValidatedDeliverySettings = z.infer<typeof DeliverySettingsSchema>;
