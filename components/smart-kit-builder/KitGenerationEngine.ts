import { BusinessGoal, GeneratedKit, KitStrategyType, ProductInput } from './types';

// Constants
const BASE_DELIVERY_COST = 5.00; // Base delivery cost estimate
const YALA_COMMISSION_RATE = 0.15; // 15% commission default
const ELASTICITY_FACTOR = 1.5; // Price elasticity factor (e.g. 10% off -> 15% more sales)

/**
 * AI-powered Kit Generation Engine
 * Generates 3 optimized product bundles based on business inputs.
 */
export const generateSmartKits = (products: ProductInput[], goal: BusinessGoal): GeneratedKit[] => {
    if (products.length < 2) {
        throw new Error("Select at least 2 products to generate a kit.");
    }

    // 1. Generate 3 unique strategies
    const strategies: KitStrategyType[] = ['HIGH_VOLUME', 'BALANCED', 'PREMIUM'];

    return strategies.map(strategy => createKitvariant(strategy, products, goal));
};

const createKitvariant = (strategy: KitStrategyType, products: ProductInput[], goal: BusinessGoal): GeneratedKit => {
    // Simple heuristic: 
    // - High Volume: Focus on lower margin, higher discount (using cheaper items or bulk)
    // - Balanced: Mix of high & low margin items
    // - Premium: Focus on high value items, lower discount

    // Sort products by margin or price depending on strategy
    const sortedProducts = [...products].sort((a, b) => {
        const marginA = (a.price - a.cost) / a.price;
        const marginB = (b.price - b.cost) / b.price;

        if (strategy === 'HIGH_VOLUME') return a.price - b.price; // Cheapest first
        if (strategy === 'PREMIUM') return b.price - a.price; // Most expensive first
        return marginB - marginA; // Highest margin first for Balanced
    });

    // Select top N items (2-4 items for a bundle)
    const bundleItems = sortedProducts.slice(0, Math.min(sortedProducts.length, 3)).map(p => ({
        product: p,
        quantity: 1 // Default quantity
    }));

    // Calculate base financials
    const originalPrice = bundleItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const cost = bundleItems.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0);

    // Optimized Pricing Logic
    let discount = 0;
    if (strategy === 'HIGH_VOLUME') discount = 0.20; // Aggressive discount
    else if (strategy === 'BALANCED') discount = 0.12; // Moderate
    else discount = 0.05; // Premium positioning

    let bundlePrice = originalPrice * (1 - discount);

    // Psychological Pricing (.99 / .95)
    bundlePrice = Math.floor(bundlePrice) + 0.99;

    // Recalculate if margin is too low
    const minMarginAmount = bundlePrice * (goal.minMargin / 100);
    if (bundlePrice - cost < minMarginAmount) {
        // Adjust price to meet minimum margin if possible
        bundlePrice = cost + minMarginAmount;
        discount = (originalPrice - bundlePrice) / originalPrice;
    }

    // Financials
    const deliveryCost = BASE_DELIVERY_COST; // Flat for now
    const commission = bundlePrice * YALA_COMMISSION_RATE;
    const netProfit = bundlePrice - cost - commission - deliveryCost;
    const margin = (netProfit / bundlePrice) * 100;

    // AI Logic: Score & Explanation
    const conversionScore = Math.min(98, Math.round(50 + (discount * 100 * ELASTICITY_FACTOR)));

    let explanation = "";
    if (strategy === 'HIGH_VOLUME') explanation = "Optimized for maximum turnover. Uses high-discount strategy to clear inventory quickly while maintaining base profitability.";
    else if (strategy === 'PREMIUM') explanation = "Targets higher-tier customers with premium selection. Maintains high margins with perceived value rather than deep discounts.";
    else explanation = "Balanced approach offering good value to customers while protecting your bottom line. Recommended for general promotion.";

    return {
        id: `kit-${strategy}-${Date.now()}`,
        strategy,
        name: generateKitName(strategy, bundleItems),
        items: bundleItems,
        originalPrice,
        bundlePrice,
        discountPercentage: Math.round(discount * 100),
        merchantCost: cost,
        merchantProfit: netProfit,
        merchantMargin: Math.round(margin), // net profit / price
        yalaCommission: commission,
        yalaCommissionRate: YALA_COMMISSION_RATE * 100,
        deliveryCost,
        netProfitAfterAll: netProfit,
        conversionScore,
        aiExplanation: explanation,
        risks: generateRisks(margin, goal.minMargin, discount)
    };
};

const generateKitName = (strategy: string, items: { product: ProductInput }[]): string => {
    const mainItem = items[0].product.name;
    if (strategy === 'HIGH_VOLUME') return `${mainItem} & Essentials Bundle`;
    if (strategy === 'PREMIUM') return `Luxury ${mainItem} Collection`;
    return `${mainItem} Smart Kit`;
};

const generateRisks = (margin: number, minMargin: number, discount: number): string[] => {
    const risks = [];
    if (margin < minMargin) risks.push("Profit margin is below your target.");
    if (discount > 0.30) risks.push("High discount may devalue brand perception.");
    if (margin < 5) risks.push("Very low margin - sensitive to cost fluctuations.");
    return risks.length ? risks : ["Low Risk - Safe to Launch"];
};
