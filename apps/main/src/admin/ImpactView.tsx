import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import {
    AdminImpactCampaign,
    AdminLeaderboardEntry,
    ImpactCampaignFormData,
} from "./types";
import ConfirmModal from "@/components/ConfirmModal";
import { logger } from "@/services/logger";

const ImpactView: React.FC = () => {
    const [campaigns, setCampaigns] = useState<AdminImpactCampaign[]>([]);
    const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState<ImpactCampaignFormData>({
        title: "",
        description: "",
        image_url: "",
        goal_amount: 0,
        goal_type: "trees",
        impact_per_dollar: 1,
        is_active: true,
        show_on_impact_page: true,
    });

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from("impact_campaigns")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setCampaigns(data || []);
        } catch (err) {
            logger.error("Failed to fetch campaigns", err);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const { data: contributions, error } = await supabase
                .from("user_impact")
                .select("user_id, impact_units, created_at")
                .order("impact_units", { ascending: false });

            if (error) throw error;
            if (!contributions) return;

            // Aggregate by user
            const userTotals: Record<string, number> = {};
            contributions.forEach((item: any) => {
                if (!userTotals[item.user_id]) userTotals[item.user_id] = 0;
                userTotals[item.user_id] += item.impact_units || 0;
            });

            const sorted = Object.entries(userTotals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            // Get names
            const userIds = sorted.map(([id]) => id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds);

            const nameMap = new Map<string, string>(
                profiles?.map((p: any) => [p.id, p.full_name || "Anonymous"]) || []
            );

            setLeaderboard(
                sorted.map(([userId, impact], index) => ({
                    rank: index + 1,
                    user_id: userId,
                    name: nameMap.get(userId) || "Anonymous",
                    impact: Math.floor(impact),
                }))
            );
        } catch (err) {
            logger.error("Failed to fetch leaderboard", err);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchLeaderboard();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from("impact_campaigns").insert(formData);
            if (error) throw error;
            setIsModalOpen(false);
            setFormData({
                title: "",
                description: "",
                image_url: "",
                goal_amount: 0,
                goal_type: "trees",
                impact_per_dollar: 1,
                is_active: true,
                show_on_impact_page: true,
            });
            fetchCampaigns();
        } catch (err) {
            logger.error("Failed to save campaign", err);
        }
    };

    const toggleCampaign = async (id: string, isActive: boolean) => {
        try {
            const { error } = await supabase
                .from("impact_campaigns")
                .update({ is_active: !isActive })
                .eq("id", id);
            if (error) throw error;
            fetchCampaigns();
        } catch (err) {
            logger.error("Failed to toggle campaign", err);
        }
    };

    const confirmDelete = (id: string) => {
        setCampaignToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!campaignToDelete) return;
        try {
            const { error } = await supabase.from("impact_campaigns").delete().eq("id", campaignToDelete);
            if (error) throw error;
            fetchCampaigns();
        } catch (err) {
            logger.error("Failed to delete campaign", err);
        }
        setCampaignToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-800">Impact Campaigns</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                    <i className="fas fa-plus mr-2"></i>
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign: AdminImpactCampaign) => {
                    const progress =
                        campaign.goal_amount > 0
                            ? Math.min(
                                (campaign.current_amount / campaign.goal_amount) * 100,
                                100
                            )
                            : 0;

                    return (
                        <div
                            key={campaign.id}
                            className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all duration-300 ${!campaign.is_active ? "opacity-60 saturate-50" : "hover:shadow-md"
                                }`}
                        >
                            {campaign.image_url && (
                                <div className="h-40 bg-gray-100">
                                    <img
                                        src={campaign.image_url}
                                        alt={campaign.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-slate-900">{campaign.title}</h4>
                                    <span
                                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${campaign.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-500"
                                            }`}
                                    >
                                        {campaign.is_active ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    {campaign.description}
                                </p>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500">Progress</span>
                                        <span className="font-bold text-slate-900">{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        ${campaign.current_amount || 0} raised of $
                                        {campaign.goal_amount} goal
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            toggleCampaign(campaign.id, campaign.is_active)
                                        }
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${campaign.is_active
                                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                    >
                                        {campaign.is_active ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(campaign.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {campaigns.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        <i className="fas fa-globe text-4xl mb-4 opacity-20"></i>
                        <p>No campaigns yet. Create your first impact campaign!</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] p-6 border shadow-sm">
                <h4 className="font-bold text-lg mb-6 text-slate-800">Top Contributors</h4>
                <div className="space-y-3">
                    {leaderboard.map((entry: AdminLeaderboardEntry) => (
                        <div
                            key={entry.rank}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-white hover:border-slate-200 transition-colors"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${entry.rank === 1
                                    ? "bg-yellow-400 text-yellow-900"
                                    : entry.rank === 2
                                        ? "bg-slate-300 text-slate-700"
                                        : entry.rank === 3
                                            ? "bg-amber-600 text-white"
                                            : "bg-slate-200 text-slate-500"
                                    }`}
                            >
                                {entry.rank}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800">{entry.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 text-lg">{entry.impact}</p>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">impact units</p>
                            </div>
                        </div>
                    ))}
                    {leaderboard.length === 0 && (
                        <p className="text-center text-slate-400 py-4 italic">No contributors yet</p>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Campaign?"
                message="This action cannot be undone. All contribution history for this campaign will be disconnected."
                variant="danger"
                confirmText="Delete Now"
            />

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold mb-8 text-slate-900">New Impact Campaign</h3>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Campaign Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Plant Trees for Gaza"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) =>
                                        setFormData({ ...formData, image_url: e.target.value })
                                    }
                                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Goal Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.goal_amount}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                goal_amount: parseFloat(e.target.value),
                                            })
                                        }
                                        className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Impact Type
                                    </label>
                                    <select
                                        value={formData.goal_type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                goal_type: e.target.value as any,
                                            })
                                        }
                                        className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    >
                                        <option value="trees">Trees</option>
                                        <option value="meals">Meals</option>
                                        <option value="donations">Donations</option>
                                        <option value="water">Water (L)</option>
                                        <option value="books">Books</option>
                                        <option value="medicine">Medicine Kits</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]"
                                >
                                    Start Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImpactView;
