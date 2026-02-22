import React, { useState, useEffect } from "react";
import { ImpactCampaign } from "@/types";
import { supabase } from "@/services/supabaseClient";

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

import { useStore } from "@/store/useStore";

const ImpactPage: React.FC = () => {
    const { lang, user } = useStore();
    const isRTL = lang === 'ar';

    const [campaigns, setCampaigns] = useState<ImpactCampaign[]>([]);
    const [userStats, setUserStats] = useState<ImpactUserStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const { data: campaignData } = await supabase
                .from("impact_campaigns")
                .select("*")
                .eq("is_active", true)
                .eq("show_on_impact_page", true)
                .order("created_at", { ascending: false });
            setCampaigns(campaignData || []);

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

    useEffect(() => {
        const channel = supabase
            .channel("impact-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "impact_campaigns" }, () => fetchData())
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_impact" }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getBadgeDetails = (level: string) => {
        const badges: Record<string, { name: string; color: string; icon: string }> = {
            supporter: { name: isRTL ? 'داعم' : 'SUPPORTER', color: "text-primary/60", icon: "fa-hand-holding-heart" },
            changemaker: { name: isRTL ? 'صانع تغيير' : 'CHANGEMAKER', color: "text-primary/80", icon: "fa-star" },
            hero: { name: isRTL ? 'بطل الأثر' : 'IMPACT HERO', color: "text-primary", icon: "fa-crown" },
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

    if (loading) return null;

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-16 pb-32 animate-entrance px-4">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 block">
                    {isRTL ? 'أثرنا المجتمعي' : 'OUR SOCIAL FOOTPRINT'}
                </span>
                <h1 className="font-luxury text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-none">
                    {isRTL ? 'الأثر' : 'The Impact'}
                </h1>
                <p className="text-white/40 text-sm sm:text-lg leading-relaxed font-medium">
                    {isRTL
                        ? 'شاهد كيف تساهم طلباتك في إحداث تغيير حقيقي في المجتمع.'
                        : 'Meticulously tracking how your artifacts contribute to global change.'}
                </p>
            </div>

            {/* User Stats Card */}
            {user && userStats && (
                <div className="luxury-card p-10 bg-luxury-glow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className={`fas ${getBadgeDetails(userStats.badgeLevel).icon} text-9xl`}></i>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Current Standing</span>
                            <div className={`text-2xl font-black uppercase tracking-widest ${getBadgeDetails(userStats.badgeLevel).color}`}>
                                {getBadgeDetails(userStats.badgeLevel).name}
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-12">
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Contributed</p>
                                <p className="text-2xl font-black text-white tracking-tighter">${userStats.totalContributed.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Impact Units</p>
                                <p className="text-2xl font-black text-primary tracking-tighter">{Math.floor(userStats.totalImpact)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Selections</p>
                                <p className="text-2xl font-black text-white tracking-tighter">{userStats.contributions}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Next Evolution</p>
                                <p className="text-xs font-black text-primary uppercase tracking-widest mt-2">
                                    {userStats.badgeLevel === "supporter" ? "CHANGEMAKER" : userStats.badgeLevel === "changemaker" ? "IMPACT HERO" : "ZENITH"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Grid */}
            <div className="space-y-10">
                <div className="flex items-center justify-between">
                    <h2 className="font-luxury text-3xl font-black text-white italic">{isRTL ? 'الحملات النشطة' : 'Active Initiatives'}</h2>
                    <div className="h-[1px] flex-1 mx-10 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {campaigns.map((campaign) => {
                        const progress = campaign.goal_amount > 0 ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100) : 0;
                        return (
                            <div key={campaign.id} className="luxury-card overflow-hidden group">
                                {campaign.image_url && (
                                    <div className="h-64 overflow-hidden relative">
                                        <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E17] via-[#0B0E17]/20 to-transparent"></div>
                                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-primary">
                                                <i className={`fas ${getImpactIcon(campaign.goal_type)}`}></i>
                                            </div>
                                            <h3 className="font-luxury text-2xl font-black text-white">{campaign.title}</h3>
                                        </div>
                                    </div>
                                )}
                                <div className="p-8">
                                    <p className="text-xs text-white/40 mb-8 leading-relaxed line-clamp-2">{campaign.description}</p>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">RAISED</p>
                                                <p className="text-xl font-black text-white tracking-tighter">${campaign.current_amount || 0}</p>
                                            </div>
                                            <p className="text-2xl font-black text-primary tracking-tighter">{progress.toFixed(0)}%</p>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gold-gradient rounded-full shadow-[0_0_15px_rgba(200,169,81,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.2em] pt-2">
                                            <span>GOAL: ${campaign.goal_amount}</span>
                                            <span>{campaign.impact_per_dollar} UNITS PER $</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Leaderboard - Refined */}
            {leaderboard.length > 0 && (
                <div className="luxury-card p-10 border-white/5 bg-luxury-glow">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary shadow-2xl">
                            <i className="fas fa-trophy text-xl"></i>
                        </div>
                        <h3 className="font-luxury text-3xl font-black text-white">{isRTL ? 'كبار المساهمين' : 'The Vanguard'}</h3>
                    </div>

                    <div className="grid gap-4">
                        {leaderboard.map((entry) => (
                            <div key={entry.rank} className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${entry.rank === 1 ? "bg-primary text-black" : "bg-white/10 text-white/40"
                                    }`}>
                                    {entry.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-white text-xs uppercase tracking-widest">{entry.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-primary tracking-tighter">{entry.impact}</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">UNITS</p>
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
