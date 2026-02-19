import { useContext, useEffect, useState, useCallback } from "react";
import DriverAuthContext from "../context/DriverAuthContext";
import { supabase } from "@/services/supabaseClient";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    created_at: string;
}

const DriverWallet = () => {
    const { session } = useContext(DriverAuthContext);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, tips: 0, deliveries: 0 });

    const fetchData = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);

        try {
            const { data: trans } = await supabase
                .from("driver_transactions")
                .select("id, type, amount, created_at")
                .eq("driver_id", session.user.id)
                .order("created_at", { ascending: false });

            if (trans) {
                setTransactions(trans);
                const total = trans.reduce((sum, item) => sum + (item.amount || 0), 0);
                const tips = trans.filter((t) => t.type === "tip").reduce((sum, item) => sum + (item.amount || 0), 0);
                setStats((prev) => ({ ...prev, total, tips }));
            }

            const { count } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("driver_id", session.user.id)
                .eq("status", "delivered");

            if (count !== null) setStats((prev) => ({ ...prev, deliveries: count }));
        } catch {
            // Wallet data will remain at defaults
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white shadow-sm p-4 text-center">
                <h1 className="font-bold text-gray-800">My Earnings</h1>
            </header>

            <div className="p-4 space-y-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                    <p className="text-white/70 text-sm font-medium">Available Balance</p>
                    <h2 className="text-4xl font-bold mt-1">${stats.total.toLocaleString()}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <i className="fa-solid fa-gift text-yellow-300 opacity-80 mb-1" />
                            <p className="text-xs text-white/70">Tips</p>
                            <p className="font-bold">${stats.tips}</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <i className="fa-solid fa-box text-blue-300 opacity-80 mb-1" />
                            <p className="text-xs text-white/70">Deliveries</p>
                            <p className="font-bold">{stats.deliveries}</p>
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Recent Activity</h3>
                        <span className="text-blue-600 text-xs font-bold">{transactions.length} Total</span>
                    </div>
                    <div>
                        {loading ? (
                            <div className="p-8 text-center">
                                <i className="fa-solid fa-circle-notch fa-spin text-gray-300 text-xl" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <i className="fa-solid fa-receipt text-2xl mb-2 opacity-50 block" />
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="p-4 border-b border-gray-50 flex justify-between items-center last:border-none">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "tip" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                                            <i className={`fa-solid ${tx.type === "tip" ? "fa-star" : "fa-arrow-down"}`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 capitalize">{tx.type}</p>
                                            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverWallet;
