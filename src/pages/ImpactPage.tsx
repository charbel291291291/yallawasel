import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, ImpactCampaign, AppSettings } from "../types";
import { translations, Language } from "../translations";
import { supabase } from "../services/supabaseClient";

interface ImpactUserStats {
    totalContributed: number;
    totalImpact: number;
    badgeLevel: string;
    contributions: number;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    impact: number;
}

interface ImpactPageProps {
    lang: Language;
    settings: AppSettings;
    user?: User | null;
}

const ImpactPage: React.FC<ImpactPageProps> = ({ lang, settings, user }) => {
    const t = translations[lang];
    const [campaigns, setCampaigns] = useState<ImpactCampaign[]>([]);
    const [userStats, setUserStats] = useState<ImpactUserStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch active campaigns
            const { data: campaignData } = await supabase
                .from("impact_campaigns")
                .select("*")
                .eq("is_active", true)
                .eq("show_on_impact_page", true)
                .order("created_at", { ascending: false });
            setCampaigns(campaignData || []);

            // Fetch user stats if logged in
            if (user?.id) {
                const { data: contributions } = await supabase
                    .from("user_impact")
                    .select("*")
                    .eq("user_id", user.id);

                if (contributions && contributions.length > 0) {
                    const totalContributed = contributions.reduce(
                        (sum: number, c: { contribution_amount?: number }) => sum + (c.contribution_amount || 0),
                        0
                    );
                    const totalImpact = contributions.reduce(
                        (sum: number, c: { impact_units?: number }) => sum + (c.impact_units || 0),
                        0
                    );

                    let badgeLevel = "supporter";
                    if (totalImpact >= 200) badgeLevel = "hero";
                    else if (totalImpact >= 50) badgeLevel = "changemaker";

                    setUserStats({
                        totalContributed,
                        totalImpact,
                        badgeLevel,
                        contributions: contributions.length,
                    });
                }
            }

            // Fetch leaderboard
            const { data: contributions } = await supabase
                .from("user_impact")
                .select("user_id, impact_units")
                .order("impact_units", { ascending: false });

            if (contributions) {
                const userTotals: Record<string, number> = {};
                contributions.forEach((item) => {
                    if (!userTotals[item.user_id]) userTotals[item.user_id] = 0;
                    userTotals[item.user_id] += item.impact_units || 0;
                });

                const sorted = Object.entries(userTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                const userIds = sorted.map(([id]) => id);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds);

                const nameMap = new Map(
                    profiles?.map((p) => [p.id, p.full_name]) || []
                );

                setLeaderboard(
                    sorted.map(([userId, impact], index) => ({
                        rank: index + 1,
                        name: nameMap.get(userId) || "Anonymous",
                        impact: Math.floor(impact),
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching impact data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel("impact-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "impact_campaigns",
                },
                () => fetchData()
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "user_impact",
                },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getBadgeDetails = (level: string) => {
        const badges: Record<string, { name: string; color: string; bgColor: string; icon: string; message: string }> = {
            supporter: {
                name: "Supporter",
                color: "text-amber-600",
                bgColor: "bg-amber-100",
                icon: "fa-hand-holding-heart",
                message: "Thank you for your support!",
            },
            changemaker: {
                name: "Changemaker",
                color: "text-gray-400",
                bgColor: "bg-gray-200",
                icon: "fa-star",
                message: "You're making a real difference!",
            },
            hero: {
                name: "Impact Hero",
                color: "text-yellow-500",
                bgColor: "bg-yellow-100",
                icon: "fa-crown",
                message: "You're an Impact Hero!",
            },
        };
        return badges[level] || badges.supporter;
    };

    const getImpactIcon = (type: string) => {
        const icons: Record<string, string> = {
            trees: "fa-tree",
            meals: "fa-utensils",
            donations: "fa-heart",
            water: "fa-tint",
            books: "fa-book",
            medicine: "fa-pills",
        };
        return icons[type] || "fa-hands-helping";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 animate-3d-entrance px-4">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-5xl shadow-2xl animate-float">
                    <i className="fa-solid fa-globe-americas"></i>
                </div>
                <h1 className="font-luxury text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    {t.impact || "Our Impact"}
                </h1>
                <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
                    {t.impactDesc ||
                        "See how your orders are making a difference in the community."}
                </p>
            </div>

            {/* User Stats (if logged in) */}
            {user && userStats && (
                <div className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-[2rem] p-8 border border-green-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div
                            className={`w-14 h-14 rounded-full ${getBadgeDetails(userStats.badgeLevel).bgColor
                                } flex items-center justify-center`}
                        >
                            <i
                                className={`fas ${getBadgeDetails(userStats.badgeLevel).icon} ${getBadgeDetails(userStats.badgeLevel).color
                                    } text-xl`}
                            ></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Your Impact Level</p>
                            <p
                                className={`text-xl font-bold ${getBadgeDetails(userStats.badgeLevel).color
                                    }`}
                            >
                                {getBadgeDetails(userStats.badgeLevel).name}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-black text-gray-900">
                                ${userStats.totalContributed.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">Contributed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-green-600">
                                {Math.floor(userStats.totalImpact)}
                            </p>
                            <p className="text-sm text-gray-500">Impact Units</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-gray-900">
                                {userStats.contributions}
                            </p>
                            <p className="text-sm text-gray-500">Contributions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">Next Badge</p>
                            <p className="text-lg font-bold text-green-600">
                                {userStats.badgeLevel === "supporter"
                                    ? "50 → Changemaker"
                                    : userStats.badgeLevel === "changemaker"
                                        ? "150 → Hero"
                                        : "Max Level!"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Cards */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map((campaign) => {
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
                                className="depth-card rounded-[2rem] overflow-hidden"
                            >
                                {campaign.image_url && (
                                    <div className="h-48 bg-gray-100">
                                        <img
                                            src={campaign.image_url}
                                            alt={campaign.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <i
                                                className={`fas ${getImpactIcon(
                                                    campaign.goal_type
                                                )} text-green-600`}
                                            ></i>
                                        </div>
                                        <h3 className="font-bold text-xl">{campaign.title}</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                        {campaign.description}
                                    </p>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">
                                                ${campaign.current_amount || 0} raised
                                            </span>
                                            <span className="font-bold">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Goal: ${campaign.goal_amount} ·{" "}
                                            {campaign.impact_per_dollar} {campaign.goal_type} per $
                                        </p>
                                    </div>

                                    {!user && (
                                        <Link
                                            to="/login"
                                            className="block w-full py-3 bg-green-600 text-white text-center rounded-xl font-bold hover:bg-green-700 transition-colors"
                                        >
                                            Login to Track Your Impact
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {campaigns.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            <i className="fas fa-globe-americas text-5xl mb-4"></i>
                            <p className="text-lg">No active campaigns at the moment</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
                <div className="bg-white rounded-[2rem] p-8 border shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-trophy text-yellow-600 text-xl"></i>
                        </div>
                        <h3 className="font-bold text-xl">Top Contributors</h3>
                    </div>
                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${entry.rank === 1
                                        ? "bg-yellow-400 text-yellow-900"
                                        : entry.rank === 2
                                            ? "bg-gray-300 text-gray-700"
                                            : entry.rank === 3
                                                ? "bg-amber-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {entry.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">{entry.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-green-600 text-lg">
                                        {entry.impact}
                                    </p>
                                    <p className="text-xs text-gray-400">impact units</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImpactPage;
