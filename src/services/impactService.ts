import { supabase } from "@/services/supabaseClient";
import {
  ImpactCampaign,
  UserImpact,
  UserImpactStats,
  ImpactBadgeLevel,
} from "@/types";
import { logger } from "@/services/logger";
import {
  ImpactCampaignSchema,
  UserImpactSchema,
  validateArray,
  validateSingle,
} from "@/validation";

const DEFAULT_IMPACT_PERCENTAGE = 3; // 3% of order goes to impact

// Get impact percentage from settings
export const getImpactPercentage = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("impact_percentage")
      .single();

    if (error || !data) return DEFAULT_IMPACT_PERCENTAGE;
    return data.impact_percentage || DEFAULT_IMPACT_PERCENTAGE;
  } catch {
    return DEFAULT_IMPACT_PERCENTAGE;
  }
};

// Get all active campaigns for impact page
export const getActiveCampaigns = async (): Promise<ImpactCampaign[]> => {
  const { data, error } = await supabase
    .from("impact_campaigns")
    .select("*")
    .eq("is_active", true)
    .eq("show_on_impact_page", true)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching campaigns:", error);
    return [];
  }

  return validateArray(ImpactCampaignSchema, data, "getActiveCampaigns");
};

// Get single campaign
export const getCampaign = async (
  id: string
): Promise<ImpactCampaign | null> => {
  const { data, error } = await supabase
    .from("impact_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return validateSingle(ImpactCampaignSchema, data, "getCampaign");
};

// Get user's impact stats
export const getUserImpactStats = async (
  userId: string
): Promise<UserImpactStats> => {
  try {
    // Get all user contributions
    const { data: contributions, error } = await supabase
      .from("user_impact")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !contributions) {
      return {
        totalContributed: 0,
        totalImpactUnits: 0,
        badgeLevel: "supporter",
        campaignContributions: [],
      };
    }

    const validContributions = validateArray(UserImpactSchema, contributions, "getUserImpactStats");

    const totalContributed = validContributions.reduce(
      (sum: number, c: UserImpact) => sum + (c.contribution_amount || 0),
      0
    );

    const totalImpactUnits = validContributions.reduce(
      (sum: number, c: UserImpact) => sum + (c.impact_units || 0),
      0
    );

    const badgeLevel = calculateBadgeLevel(totalImpactUnits);

    return {
      totalContributed,
      totalImpactUnits,
      badgeLevel,
      campaignContributions: validContributions,
    };
  } catch (err) {
    logger.error("Error fetching user impact stats:", err);
    return {
      totalContributed: 0,
      totalImpactUnits: 0,
      badgeLevel: "supporter",
      campaignContributions: [],
    };
  }
};

// Calculate badge level based on impact units
export const calculateBadgeLevel = (impactUnits: number): ImpactBadgeLevel => {
  if (impactUnits >= 200) return "hero";
  if (impactUnits >= 50) return "changemaker";
  return "supporter";
};

// Get badge details
export const getBadgeDetails = (level: ImpactBadgeLevel) => {
  const badges = {
    supporter: {
      name: "Supporter",
      min: 0,
      max: 49,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      icon: "fa-hand-holding-heart",
      message: "Thank you for your support!",
    },
    changemaker: {
      name: "Changemaker",
      min: 50,
      max: 199,
      color: "text-gray-400",
      bgColor: "bg-gray-200",
      icon: "fa-star",
      message: "You're making a real difference!",
    },
    hero: {
      name: "Impact Hero",
      min: 200,
      max: Infinity,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100",
      icon: "fa-crown",
      message: "You're an Impact Hero!",
    },
  };
  return badges[level];
};

// Process impact when order is delivered
export const processOrderImpact = async (
  orderId: string,
  userId: string,
  orderTotal: number,
  campaignId?: string
): Promise<void> => {
  try {
    // Get impact percentage from settings
    const impactPercentage = await getImpactPercentage();
    const contributionAmount = (orderTotal * impactPercentage) / 100;

    if (contributionAmount <= 0) return;

    // Get active campaigns
    const campaigns = await getActiveCampaigns();
    if (campaigns.length === 0) return;

    // Use specified campaign or first active campaign
    const targetCampaign = campaignId
      ? campaigns.find((c) => c.id === campaignId)
      : campaigns[0];

    if (!targetCampaign) return;

    // Calculate impact units (trees, meals, etc.)
    const impactUnits =
      contributionAmount * (targetCampaign.impact_per_dollar || 1);

    // Insert user impact contribution
    const { error: insertError } = await supabase.from("user_impact").insert({
      user_id: userId,
      campaign_id: targetCampaign.id,
      order_id: orderId,
      contribution_amount: contributionAmount,
      impact_units: impactUnits,
      impact_type: targetCampaign.goal_type || "donations",
    });

    if (insertError) {
      logger.error("Error inserting user impact:", insertError);
      return;
    }

    // Update campaign current amount
    const { error: updateError } = await supabase
      .from("impact_campaigns")
      .update({
        current_amount: targetCampaign.current_amount + contributionAmount,
      })
      .eq("id", targetCampaign.id);

    if (updateError) {
      logger.error("Error updating campaign:", updateError);
    }

    // Award bonus reward points for impact
    const bonusPoints = Math.floor(impactUnits * 10); // 10 points per impact unit
    if (bonusPoints > 0) {
      await supabase.rpc("increment_points", {
        user_id: userId,
        amount: bonusPoints,
      });
    }

    // Impact processed successfully
  } catch (error) {
    logger.error("Error processing order impact:", error);
  }
};

// Add manual contribution
export const addManualContribution = async (
  userId: string,
  campaignId: string,
  amount: number
): Promise<boolean> => {
  try {
    // Get campaign
    const campaign = await getCampaign(campaignId);
    if (!campaign) return false;

    const impactUnits = amount * (campaign.impact_per_dollar || 1);

    // Insert contribution
    const { error } = await supabase.from("user_impact").insert({
      user_id: userId,
      campaign_id: campaignId,
      contribution_amount: amount,
      impact_units: impactUnits,
      impact_type: campaign.goal_type || "donations",
    });

    if (error) {
      logger.error("Error adding contribution:", error);
      return false;
    }

    // Update campaign
    await supabase
      .from("impact_campaigns")
      .update({
        current_amount: campaign.current_amount + amount,
      })
      .eq("id", campaignId);

    // Award bonus points
    const bonusPoints = Math.floor(impactUnits * 10);
    if (bonusPoints > 0) {
      await supabase.rpc("increment_points", {
        user_id: userId,
        amount: bonusPoints,
      });
    }

    return true;
  } catch (err) {
    logger.error("Error adding manual contribution:", err);
    return false;
  }
};

// Get leaderboard (top contributors)
export const getLeaderboard = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from("user_impact")
      .select("user_id, impact_units, created_at")
      .order("impact_units", { ascending: false });

    if (error || !data) return [];

    // Aggregate by user
    const userTotals: Record<
      string,
      { impactUnits: number; latestContribution: string }
    > = {};

    data.forEach((item) => {
      if (!userTotals[item.user_id]) {
        userTotals[item.user_id] = {
          impactUnits: 0,
          latestContribution: item.created_at,
        };
      }
      userTotals[item.user_id].impactUnits += item.impact_units || 0;
      if (
        new Date(item.created_at) >
        new Date(userTotals[item.user_id].latestContribution)
      ) {
        userTotals[item.user_id].latestContribution = item.created_at;
      }
    });

    // Convert to array and sort
    const leaderboard = Object.entries(userTotals)
      .map(([userId, stats]) => ({
        userId,
        totalImpact: stats.impactUnits,
        latestContribution: stats.latestContribution,
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, limit);

    // Get user names
    const userIds = leaderboard.map((l) => l.userId);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: profileMap.get(entry.userId) || "Anonymous",
      totalImpact: Math.floor(entry.totalImpact),
    }));
  } catch (err) {
    logger.error("Error fetching leaderboard:", err);
    return [];
  }
};

// Admin: Create campaign
export const createCampaign = async (campaign: Partial<ImpactCampaign>) => {
  const { data, error } = await supabase
    .from("impact_campaigns")
    .insert(campaign)
    .select()
    .single();

  if (error) {
    logger.error("Error creating campaign:", error);
    return null;
  }
  return data;
};

// Admin: Update campaign
export const updateCampaign = async (
  id: string,
  updates: Partial<ImpactCampaign>
) => {
  const { data, error } = await supabase
    .from("impact_campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Error updating campaign:", error);
    return null;
  }
  return data;
};

// Admin: Get all campaigns (including inactive)
export const getAllCampaigns = async (): Promise<ImpactCampaign[]> => {
  const { data, error } = await supabase
    .from("impact_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
};

// Get impact type display name
export const getImpactTypeDisplay = (type: string): string => {
  const types: Record<string, string> = {
    trees: "Trees Planted",
    meals: "Meals Funded",
    donations: "Donations",
    water: "Liters of Water",
    books: "Books Donated",
    medicine: "Medicine Kits",
  };
  return types[type] || "Impact Units";
};

// Get impact type icon
export const getImpactTypeIcon = (type: string): string => {
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
