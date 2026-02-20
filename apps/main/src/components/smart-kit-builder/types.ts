export type KitStrategyType = 'HIGH_VOLUME' | 'BALANCED' | 'PREMIUM';

export interface ProductInput {
    id: string;
    name: string;
    category: string;
    cost: number;
    price: number;
    stock: number;
    salesData?: {
        dailyVelocity: number;
    };
}

export interface BusinessGoal {
    minMargin: number; // Percentage (e.g., 20)
    targetAudience?: string;
    competitorPrice?: number;
    strategy: 'CLEARANCE' | 'GROWTH' | 'PROFIT';
}

export interface GeneratedKit {
    id: string;
    strategy: KitStrategyType;
    name: string;
    items: { product: ProductInput; quantity: number }[];
    originalPrice: number;
    bundlePrice: number;
    discountPercentage: number;
    merchantCost: number;
    merchantProfit: number;
    merchantMargin: number;
    yalaCommission: number; // Amount
    yalaCommissionRate: number; // Percentage
    deliveryCost: number;
    netProfitAfterAll: number;
    conversionScore: number; // 0-100
    aiExplanation: string;
    risks: string[];
}

export interface OptimizationResult {
    kits: GeneratedKit[];
    analysisTimestamp: number;
}
