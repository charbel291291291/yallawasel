import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { AdminCustomer, PointsTransaction } from "./types";

const CustomersView: React.FC = () => {
    const [customers, setCustomers] = useState<AdminCustomer[]>([]);
    const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTier, setFilterTier] = useState("all");
    const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(
        null
    );
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustPoints, setAdjustPoints] = useState(0);
    const [adjustNote, setAdjustNote] = useState("");

    const fetchCustomers = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
        setCustomers(data || []);
    };

    const fetchTransactions = async () => {
        const { data } = await supabase
            .from("customer_transactions")
            .select("*, profiles(full_name)")
            .order("created_at", { ascending: false });
        setTransactions(data || []);
    };

    useEffect(() => {
        fetchCustomers();
        fetchTransactions();
    }, []);

    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch =
            customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm);
        const matchesTier = filterTier === "all" || customer.tier === filterTier;
        return matchesSearch && matchesTier;
    });

    const handleAdjustPoints = async () => {
        if (!selectedCustomer || adjustPoints === 0) return;

        try {
            // Add transaction record
            await supabase.from("customer_transactions").insert({
                customer_id: selectedCustomer.id,
                type: "adjust",
                points: adjustPoints,
                note: adjustNote || "Manual adjustment",
            });

            // Update customer points
            await supabase.rpc("increment_points", {
                user_id: selectedCustomer.id,
                amount: adjustPoints,
            });

            // Refresh data
            await fetchCustomers();
            await fetchTransactions();

            setIsAdjustModalOpen(false);
            setAdjustPoints(0);
            setAdjustNote("");
            alert("Points adjusted successfully!");
        } catch (error) {
            console.error("Error adjusting points:", error);
            alert("Error adjusting points");
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case "vip":
                return "bg-purple-500 text-white";
            case "gold":
                return "bg-yellow-500 text-yellow-900";
            case "silver":
                return "bg-gray-400 text-gray-900";
            default:
                return "bg-amber-800 text-amber-100";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h3 className="font-bold text-xl">Customer Relationship Management</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-64"
                    />
                    <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
                    >
                        <option value="all">All Tiers</option>
                        <option value="Bronze">Bronze</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="VIP">VIP</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h4 className="font-bold text-lg">Customer Database</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Tier</th>
                                    <th className="p-4">Points</th>
                                    <th className="p-4">Total Spent</th>
                                    <th className="p-4">Visits</th>
                                    <th className="p-4">Joined</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="p-4 font-bold">
                                            {customer.full_name || "Anonymous"}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getTierColor(
                                                    customer.tier
                                                )}`}
                                            >
                                                {customer.tier || "Bronze"}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-gray-700">
                                            {customer.points?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 font-bold">
                                            ${customer.total_spent?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {customer.visits_count || 0}
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs">
                                            {new Date(customer.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => setSelectedCustomer(customer)}
                                                className="text-primary hover:text-primary-dark font-bold text-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400">
                                            No customers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                    <h4 className="font-bold text-lg mb-4">Recent Activity</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {transactions.slice(0, 10).map((transaction) => (
                            <div
                                key={transaction.id}
                                className="border-b border-gray-100 pb-3 last:border-0"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">
                                            {transaction.profiles?.full_name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {transaction.type}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(transaction.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`font-bold ${(transaction.points ?? 0) >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}
                                    >
                                        {(transaction.points ?? 0) >= 0 ? "+" : ""}
                                        {transaction.points ?? 0}
                                    </span>
                                </div>
                                {transaction.note && (
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                        {transaction.note}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {selectedCustomer.full_name}
                                </h3>
                                <p className="text-gray-500">{selectedCustomer.email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Current Tier
                                </p>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(
                                        selectedCustomer.tier
                                    )}`}
                                >
                                    {selectedCustomer.tier || "Bronze"}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Total Points
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {selectedCustomer.points?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Total Spent
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                    ${selectedCustomer.total_spent?.toFixed(2) || "0.00"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Visits
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                    {selectedCustomer.visits_count || 0}
                                </p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h4 className="font-bold text-lg mb-4">Points History</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {transactions
                                    .filter((t) => t.customer_id === selectedCustomer.id)
                                    .map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-bold text-sm capitalize">
                                                    {transaction.type}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {transaction.note}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(transaction.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <span
                                                className={`font-bold text-lg ${(transaction.points ?? 0) >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                {(transaction.points ?? 0) >= 0 ? "+" : ""}
                                                {transaction.points ?? 0}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAdjustModalOpen(true)}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            Adjust Points
                        </button>
                    </div>
                </div>
            )}

            {/* Adjust Points Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">Adjust Points</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Points Adjustment
                                </label>
                                <input
                                    type="number"
                                    value={adjustPoints}
                                    onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                    placeholder="Enter points (positive or negative)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={adjustNote}
                                    onChange={(e) => setAdjustNote(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl h-24"
                                    placeholder="Reason for adjustment..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustPoints}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersView;
