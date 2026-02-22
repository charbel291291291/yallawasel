import { DriverStats, DriverTier } from '../../types';

/**
 * PRODUCTION TIER ENGINE
 * Computes driver prestige and benefits based on hard metrics.
 */
export const TierEngine = {
    calculateTier(stats: DriverStats): DriverTier {
        const { completed_deliveries, acceptance_rate, completion_rate } = stats;

        if (completed_deliveries >= 100 && acceptance_rate >= 0.95 && completion_rate >= 0.98) {
            return 'Gold';
        }

        if (completed_deliveries >= 25 && acceptance_rate >= 0.85) {
            return 'Silver';
        }

        return 'Bronze';
    },

    getMultiplier(tier: DriverTier): number {
        switch (tier) {
            case 'Gold': return 1.2;
            case 'Silver': return 1.1;
            default: return 1.0;
        }
    },

    getNextTierRequirements(stats: DriverStats): string | null {
        const currentTier = this.calculateTier(stats);
        if (currentTier === 'Gold') return null;
        if (currentTier === 'Silver') return '75 more missions for Gold';
        return '25 missions for Silver';
    }
};
