import React, { useState } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';

export const WalletPanel: React.FC = () => {
    const { wallet, addTransaction } = useDriverStore();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const handleWithdraw = () => {
        if (wallet.balance <= 0) return;
        if (confirm('Initiate withdrawal of $' + wallet.balance.toFixed(2) + ' to your primary bank node?')) {
            addTransaction({
                amount: wallet.balance,
                type: 'withdrawal',
                description: 'Operational payout withdrawal'
            });
            alert('Transfer initiated. ETA: 24-48 Business Hours.');
        }
    };

    return (
        <section className="p-6">
            <div className="terminal-card overflow-hidden bg-gradient-to-br from-[#1A1A20] to-[#0E0E11] border-white/10">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-6 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-500/20">
                            <i className="fas fa-vault text-lg"></i>
                        </div>
                        <div className="text-left">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1">{t('wallet.balance')}</span>
                            <span className="text-2xl font-black text-white tracking-tighter tabular-nums">${wallet.balance.toFixed(2)}</span>
                        </div>
                    </div>
                    <i className={`fas fa-chevron-down text-white/10 group-hover:text-green-500 transition-all ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isOpen && (
                    <div className="px-6 pb-8 animate-entrance">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">{t('wallet.today')}</span>
                                <span className="text-lg font-black text-green-500 tracking-tighter tabular-nums">${wallet.today_earnings.toFixed(2)}</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">{t('wallet.pending')}</span>
                                <span className="text-lg font-black text-white/40 tracking-tighter tabular-nums">${wallet.pending_payouts.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleWithdraw}
                            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all mb-8 ${wallet.balance > 0
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 active:scale-95'
                                    : 'bg-white/5 text-white/10 cursor-not-allowed'
                                }`}
                        >
                            {t('wallet.withdraw')}
                        </button>

                        <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-2">{t('wallet.history')}</h4>
                            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {wallet.transactions.length === 0 ? (
                                    <div className="text-center py-8 opacity-10">
                                        <p className="text-[10px] uppercase font-black tracking-widest">Archive Empty</p>
                                    </div>
                                ) : (
                                    wallet.transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-green-500/20 transition-all">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    <i className={`fas ${tx.type === 'withdrawal' ? 'fa-arrow-up' : 'fa-plus'}`}></i>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white/80 leading-none mb-1">{tx.description}</p>
                                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                                        {new Date(tx.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-black tabular-nums ${tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'
                                                }`}>
                                                {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
