/**
 * Validation Module — Public API
 * ===============================
 * Re-exports all schemas and validation utilities.
 */

// All Zod schemas and inferred types
export {
    // Enums
    UserRoleEnum,
    UserTierEnum,
    OrderStatusEnum,
    PaymentMethodEnum,
    DriverStatusEnum,
    VehicleTypeEnum,
    ImpactBadgeLevelEnum,
    LiveOfferStatusEnum,
    LiveOfferMovementEnum,
    DriverTransactionTypeEnum,
    ChartTimeRangeEnum,
    AdminLogTypeEnum,
    RedemptionStatusEnum,
    LanguageEnum,
    ThemeEnum,

    // Schema objects
    DbProfileSchema,
    UserSchema,
    WalletBalanceSchema,
    PointsTransactionSchema,
    DbProductSchema,
    ProductSchema,
    OrderItemSchema,
    DbOrderSchema,
    OrderResponseSchema,
    OrderStatusHistorySchema,
    HappyHourSchema,
    ImpactCampaignSchema,
    UserImpactSchema,
    ImpactUserStatsSchema,
    DriverProfileSchema,
    DailyStatsSchema,
    DriverTransactionSchema,
    DriverGoalSchema,
    ChartSettingsSchema,
    LiveOfferSchema,
    LiveOfferHistorySchema,
    AppSettingsSchema,
    DeliverySettingsSchema,
    DeliveryZoneSchema,
    DeliveryDaySchema,
    AdminCustomerSchema,
    AdminRewardSchema,
    AdminRedemptionSchema,
    IncrementPointsResponseSchema,
    RpcVoidResponseSchema,

    // Inferred types
    type ValidatedDbProfile,
    type ValidatedUser,
    type ValidatedOrder,
    type ValidatedProduct,
    type ValidatedHappyHour,
    type ValidatedImpactCampaign,
    type ValidatedDailyStats,
    type ValidatedChartSettings,
    type ValidatedLiveOffer,
    type ValidatedAppSettings,
    type ValidatedDeliverySettings,
} from "./schemas";

// Validation engine
export {
    validateResponse,
    validateArray,
    validateSingle,
    classifyError,
    isValidationError,
    type StructuredValidationError,
    type ValidationErrorCategory,
} from "./validate";
