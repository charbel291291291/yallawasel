import { supabase } from './supabaseClient';
import { WalletState, WalletTransaction } from '../types';

export const WalletService = {
    /**
     * Get real-time wallet balance and source-of-truth stats
     */
    async getWalletState(driverId: string): Promise<WalletState | null> {
        const { data, error } = await supabase
            .from('driver_wallets')
            .select('*')
            .eq('id', driverId)
            .single();

        if (error) {
            console.warn('[WalletService] Wallet not found, initializing...');
            return null;
        }

        // Fetch recent transactions
        const { data: txs } = await supabase
            .from('driver_transactions')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false })
            .limit(50);

        return {
            balance: data.balance,
            today_earnings: data.today_earnings,
            pending_payouts: data.pending_payouts,
            transactions: (txs || []) as WalletTransaction[]
        };
    },

    /**
     * Initiate a real withdrawal request persisted in DB
     */
    async requestWithdrawal(driverId: string, amount: number): Promise<boolean> {
        const { error } = await supabase
            .from('driver_transactions')
            .insert({
                driver_id: driverId,
                amount,
                type: 'withdrawal',
                description: 'User initiated withdrawal',
                status: 'pending'
            });

        return !error;
    },

    /**
     * Subscribe to wallet updates (balance changes)
     */
    subscribeToWallet(driverId: string, onUpdate: (wallet: Partial<WalletState>) => void) {
        return supabase
            .channel(`wallet:${driverId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'driver_wallets',
                filter: `id=eq.${driverId}`
            }, payload => {
                onUpdate({
                    balance: payload.new.balance,
                    today_earnings: payload.new.today_earnings,
                    pending_payouts: payload.new.pending_payouts
                });
            })
            .subscribe();
    }
};
