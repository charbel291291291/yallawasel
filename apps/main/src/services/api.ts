// Central API Service for Yalla Wasel
// All database operations must go through this service

import { supabase } from "./supabaseClient";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  OrderResponseSchema,
  ProductSchema,
  HappyHourSchema,
  ImpactCampaignSchema,
  validateArray,
  validateSingle,
} from "@/validation";

// Types
export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  cost?: number;
  stock?: number;
  category: string;
  image: string;
  tags: string[];
  isActive?: boolean;
}

export interface OrderItem {
  id?: string;
  name?: string;
  productName?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  user_id: string;
  driver_id?: string | null;
  full_name: string;
  phone: string;
  address: string;
  total: number;
  delivery_fee?: number;
  status: string;
  payment_method: string;
  delivery_zone?: string | null;
  items: OrderItem[];
  notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  profiles?: { full_name?: string | null; phone?: string | null; email?: string | null };
}

export interface HappyHour {
  id: string;
  created_at: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[] | null;
  multiplier: number;
  bonus_points: number;
  active: boolean;
}



export interface ImpactCampaign {
  id: string;
  created_at: string;
  title: string;
  description: string;
  image_url: string;
  goal_amount: number;
  current_amount: number;
  goal_type: string;
  impact_per_dollar: number;
  is_active: boolean;
  show_on_impact_page: boolean;
}

// ============================================
// ORDERS API
// ============================================

export const OrdersAPI = {
  // Fetch all orders (for admin)
  async getAll(filters?: { status?: string }): Promise<Order[]> {
    let query = supabase
      .from("orders")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return validateArray(OrderResponseSchema, data, "OrdersAPI.getAll");
  },

  // Fetch single order
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles(full_name, phone)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return validateSingle(OrderResponseSchema, data, "OrdersAPI.getById");
  },

  // Create new order
  async create(order: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .insert(order)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update order status
  async updateStatus(
    id: string,
    status: string,
    adminNotes?: string
  ): Promise<void> {
    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes) updateData.admin_notes = adminNotes;

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id);
    if (error) throw error;
  },

  // Subscribe to order changes (real-time)
  subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    return supabase
      .channel("orders-api-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        callback
      )
      .subscribe();
  },
};

// ============================================
// PRODUCTS API
// ============================================

export const ProductsAPI = {
  async getAll(activeOnly = true): Promise<Product[]> {
    let query = supabase.from("products").select("*").order("name");
    if (activeOnly) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return validateArray(ProductSchema, data, "ProductsAPI.getAll");
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return validateSingle(ProductSchema, data, "ProductsAPI.getById");
  },

  async create(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, product: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update(product)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    return supabase
      .channel("products-api-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        callback
      )
      .subscribe();
  },
};

// ============================================
// HAPPY HOURS API
// ============================================

export const HappyHoursAPI = {
  async getActive(): Promise<HappyHour[]> {
    const { data, error } = await supabase
      .from("happy_hours_schedule")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return validateArray(HappyHourSchema, data, "HappyHoursAPI.getActive");
  },

  async getAll(): Promise<HappyHour[]> {
    const { data, error } = await supabase
      .from("happy_hours_schedule")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return validateArray(HappyHourSchema, data, "HappyHoursAPI.getAll");
  },

  async create(hour: Partial<HappyHour>): Promise<HappyHour> {
    const { data, error } = await supabase
      .from("happy_hours_schedule")
      .insert(hour)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, hour: Partial<HappyHour>): Promise<void> {
    const { error } = await supabase
      .from("happy_hours_schedule")
      .update(hour)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("happy_hours_schedule")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    return supabase
      .channel("happyhours-api-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "happy_hours_schedule" },
        callback
      )
      .subscribe();
  },

};



// ============================================
// IMPACT CAMPAIGNS API
// ============================================

export const ImpactAPI = {
  async getActive(): Promise<ImpactCampaign[]> {
    const { data, error } = await supabase
      .from("impact_campaigns")
      .select("*")
      .eq("is_active", true)
      .eq("show_on_impact_page", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return validateArray(ImpactCampaignSchema, data, "ImpactAPI.getActive");
  },

  async getAll(): Promise<ImpactCampaign[]> {
    const { data, error } = await supabase
      .from("impact_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return validateArray(ImpactCampaignSchema, data, "ImpactAPI.getAll");
  },

  subscribe(callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
    return supabase
      .channel("impact-api-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impact_campaigns" },
        callback
      )
      .subscribe();
  },
};

// ============================================
// STATIC CATEGORIES REGISTRY
// ============================================

export const CATEGORIES = [

  { id: "impact", name: "Impact", nameAr: "Impact", icon: "fa-heart" },
  {
    id: "happyhours",
    name: "Happy Hours",
    nameAr: "ساعات سعيدة",
    icon: "fa-clock",
  },
  { id: "kits", name: "Kits", nameAr: "مجموعات", icon: "fa-box-open" },
  { id: "rewards", name: "Rewards", nameAr: "المكافآت", icon: "fa-gift" },
];

export const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "approved", label: "Approved", color: "bg-blue-100 text-blue-800" },
  {
    value: "preparing",
    label: "Preparing",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export default {
  Orders: OrdersAPI,
  Products: ProductsAPI,
  HappyHours: HappyHoursAPI,
  Impact: ImpactAPI,
  CATEGORIES,
  ORDER_STATUSES,
};
