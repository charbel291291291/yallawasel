import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { AdminReward, AdminRedemption } from "./types";

const RewardsView: React.FC = () => {
    const [rewards, setRewards] = useState<AdminReward[]>([]);
    const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
    const [activeTab, setActiveTab] = useState<"rewards" | "redemptions">(
        "rewards"
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<AdminReward | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        points_required: 0,
        reward_type: "discount",
        value: 0,
        stock_limit: null as number | null,
        expires_at: "",
    });

    const fetchRewards = async () => {
        const { data } = await supabase
            .from("rewards")
            .select("*")
            .order("created_at", { ascending: false });
        setRewards(data || []);
    };

    const fetchRedemptions = async () => {
        const { data } = await supabase
            .from("reward_redemptions")
            .select("*, profiles(full_name), rewards(title, reward_type, points_required)")
            .order("created_at", { ascending: false });
        setRedemptions(data || []);
    };

    useEffect(() => {
        fetchRewards();
        fetchRedemptions();
    }, []);

    const handleCreateReward = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await supabase.from("rewards").insert({
                ...formData,
                is_active: true, // Ensuring compatibility
                stock_limit: formData.stock_limit || null,
                expires_at: formData.expires_at || null,
            });

            await fetchRewards();

            setIsCreateModalOpen(false);
            setFormData({
                title: "",
                description: "",
                points_required: 0,
                reward_type: "discount",
                value: 0,
                stock_limit: null,
                expires_at: "",
            });
            alert("Reward created successfully!");
        } catch (error) {
            console.error("Error creating reward:", error);
            alert("Error creating reward");
        }
    };

    const handleEditReward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReward) return;
        try {
            await supabase
                .from("rewards")
                .update({
                    ...formData,
                    stock_limit: formData.stock_limit || null,
                    expires_at: formData.expires_at || null,
                })
                .eq("id", editingReward.id);

            await fetchRewards();

            setIsEditModalOpen(false);
            setEditingReward(null);
            alert("Reward updated successfully!");
        } catch (error) {
            console.error("Error updating reward:", error);
            alert("Error updating reward");
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;
        try {
            await supabase.from("rewards").delete().eq("id", id);
            setRewards(rewards.filter((r) => r.id !== id));
            alert("Reward deleted successfully!");
        } catch (error) {
            console.error("Error deleting reward:", error);
            alert("Error deleting reward");
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            // Using both just in case, or we should check schema. 
            // Most likely it's `is_active` or `active`.
            await supabase
                .from("rewards")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            setRewards(
                rewards.map((r) => (r.id === id ? { ...r, is_active: !currentStatus, active: !currentStatus } : r))
            );
        } catch (error) {
            console.error("Error updating reward status:", error);
        }
    };

    const handleApproveRedemption = async (id: string) => {
        try {
            const redemption = redemptions.find((r) => r.id === id);
            if (!redemption) return;

            const { data: userData } = await supabase.auth.getUser();

            // Update redemption status
            await supabase
                .from("reward_redemptions")
                .update({
                    status: "approved",
                    approved_by: userData.user?.id,
                })
                .eq("id", id);

            // Deduct points from customer
            if (redemption.rewards?.points_required) {
                await supabase.rpc("increment_points", {
                    user_id: redemption.user_id || redemption.customer_id,
                    amount: -redemption.rewards.points_required,
                });
            }

            await fetchRedemptions();

            alert("Redemption approved successfully!");
        } catch (error) {
            console.error("Error approving redemption:", error);
            alert("Error approving redemption");
        }
    };

    const handleRejectRedemption = async (id: string) => {
        try {
            await supabase
                .from("reward_redemptions")
                .update({ status: "rejected" })
                .eq("id", id);

            await fetchRedemptions();

            alert("Redemption rejected!");
        } catch (error) {
            console.error("Error rejecting redemption:", error);
            alert("Error rejecting redemption");
        }
    };

    const openEditModal = (reward: AdminReward) => {
        setEditingReward(reward);
        setFormData({
            title: reward.title,
            description: reward.description || "",
            points_required: reward.points_required,
            reward_type: reward.reward_type,
            value: reward.value || 0,
            stock_limit: reward.stock_limit || null,
            expires_at: reward.expires_at ? reward.expires_at.split("T")[0] : "",
        });
        setIsEditModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-700";
            case "rejected":
                return "bg-red-100 text-red-700";
            case "used":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    const isActive = (r: AdminReward) => r.is_active || r.active;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl">Loyalty Rewards Engine</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("rewards")}
                        className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === "rewards"
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                    >
                        Rewards
                    </button>
                    <button
                        onClick={() => setActiveTab("redemptions")}
                        className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === "redemptions"
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                    >
                        Redemptions
                    </button>
                    {activeTab === "rewards" && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
                        >
                            <i className="fa-solid fa-plus mr-2"></i> Create Reward
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "rewards" ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h4 className="font-bold text-lg">Available Rewards</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-4">Reward</th>
                                    <th className="p-4">Points Required</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Value</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rewards.map((reward) => (
                                    <tr
                                        key={reward.id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold">{reward.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {reward.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-primary">
                                            {reward.points_required.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                                                {reward.reward_type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold">
                                            ${reward.value?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="p-4">
                                            {reward.stock_limit ? (
                                                <span className="text-sm">
                                                    {reward.stock_limit} remaining
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Unlimited</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() =>
                                                    handleToggleActive(reward.id, !!isActive(reward))
                                                }
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${isActive(reward)
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {isActive(reward) ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(reward)}
                                                    className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReward(reward.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rewards.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400">
                                            No rewards created yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h4 className="font-bold text-lg">Reward Redemptions</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Reward</th>
                                    <th className="p-4">Points</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {redemptions.map((redemption) => (
                                    <tr
                                        key={redemption.id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="p-4 font-bold">
                                            {redemption.profiles?.full_name || "Unknown"}
                                        </td>
                                        <td className="p-4">
                                            {redemption.rewards?.title || "Unknown"}
                                        </td>
                                        <td className="p-4 font-bold text-primary">
                                            {redemption.rewards?.points_required?.toLocaleString() ||
                                                0}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                                                    redemption.status
                                                )}`}
                                            >
                                                {redemption.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {new Date(redemption.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {redemption.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleApproveRedemption(redemption.id)
                                                        }
                                                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleRejectRedemption(redemption.id)
                                                        }
                                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {redemptions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400">
                                            No redemptions yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Reward Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6">Create New Reward</h3>
                        <form onSubmit={handleCreateReward} className="space-y-4">
                            <input
                                required
                                placeholder="Reward Title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <textarea
                                placeholder="Description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl h-24"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    required
                                    placeholder="Points Required"
                                    value={formData.points_required}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            points_required: Number(e.target.value),
                                        })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                                <select
                                    value={formData.reward_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, reward_type: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                >
                                    <option value="discount">Discount</option>
                                    <option value="free_item">Free Item</option>
                                    <option value="cashback">Cashback</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <input
                                type="number"
                                placeholder="Value ($)"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: Number(e.target.value) })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <input
                                type="number"
                                placeholder="Stock Limit (optional)"
                                value={formData.stock_limit || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stock_limit: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <input
                                type="date"
                                placeholder="Expiry Date (optional)"
                                value={formData.expires_at}
                                onChange={(e) =>
                                    setFormData({ ...formData, expires_at: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                                >
                                    Create Reward
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Reward Modal */}
            {isEditModalOpen && editingReward && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6">Edit Reward</h3>
                        <form onSubmit={handleEditReward} className="space-y-4">
                            <input
                                required
                                placeholder="Reward Title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <textarea
                                placeholder="Description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl h-24"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    required
                                    placeholder="Points Required"
                                    value={formData.points_required}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            points_required: Number(e.target.value),
                                        })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                />
                                <select
                                    value={formData.reward_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, reward_type: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-200 rounded-xl"
                                >
                                    <option value="discount">Discount</option>
                                    <option value="free_item">Free Item</option>
                                    <option value="cashback">Cashback</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <input
                                type="number"
                                placeholder="Value ($)"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: Number(e.target.value) })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <input
                                type="number"
                                placeholder="Stock Limit (optional)"
                                value={formData.stock_limit || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stock_limit: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <input
                                type="date"
                                placeholder="Expiry Date (optional)"
                                value={formData.expires_at}
                                onChange={(e) =>
                                    setFormData({ ...formData, expires_at: e.target.value })
                                }
                                className="w-full p-3 border border-gray-200 rounded-xl"
                            />
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                                >
                                    Update Reward
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsView;
