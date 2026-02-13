export enum UserTier {
  BRONZE = "Bronze",
  SILVER = "Silver",
  GOLD = "Gold",
  ELITE = "Elite",
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  walletBalance: number;
  points: number;
  tier: UserTier;
  isAdmin: boolean;
  joinDate?: string;
  status?: "active" | "blocked";
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  cost?: number;
  stock?: number;
  category: "essential" | "themed" | "emergency";
  image: string;
  tags: string[];
  isActive?: boolean;
}

export interface HappyHour {
  id: string;
  created_at: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  multiplier: number;
  bonus_points: number;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  nameAr: string;
  type: "electrician" | "plumber" | "maintenance" | "cleaning";
  basePrice: number;
  available: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

export enum ViewState {
  HOME = "HOME",
  SHOP = "SHOP",
  SERVICES = "SERVICES",
  WALLET = "WALLET",
  PROFILE = "PROFILE",
  ADMIN = "ADMIN",
  AUTH = "AUTH",
}

export interface Reward {
  id: string;
  title: string;
  titleAr: string;
  pointsCost: number;
  icon: string;
}

// --- Admin Specific Types ---

export type OrderStatus =
  | "pending"
  | "approved"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  userId: string;
  userName: string;
  full_name: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
  total_amount: number;
  status: OrderStatus;
  date: string;
  created_at: string;
  updated_at: string;
  payment_method: string;
  paymentMethod: "cash" | "wallet" | "card";
  delivery_zone: string;
  deliveryZone: string;
  notes: string;
  admin_notes: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  created_by: string;
  created_at: string;
}

export interface AdminLog {
  id: string;
  action: string;
  adminName: string;
  timestamp: string;
  type: "info" | "warning" | "critical";
}

// --- Social Impact Types ---

export interface KitForGoodConfig {
  enabled: boolean;
  ratio: number; // e.g. 5 means 1 for every 5 sold
  target_product_id?: string;
  current_cycle_count: number;
  total_donated_count: number;
  last_donation_date?: string;
}

// --- Global Settings ---

export interface AppSettings {
  store_name: string;
  store_description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  maintenance_mode: boolean;
  maintenance_message?: string;
  language: "en" | "ar";
  currency: string;
  currency_symbol: string;
  timezone: string;
  theme: "light" | "dark" | "luxury";
  primary_color?: string;
  enable_2fa: boolean;
  session_timeout_minutes: number;
  tax_rate: number;
  tax_inclusive: boolean;
  enable_stripe: boolean;
  enable_cod: boolean;
  config?: {
    kit_for_good?: KitForGoodConfig;
    [key: string]: any;
  };
}

export interface DeliverySettings {
  id?: number;
  enabled: boolean;
  free_delivery_enabled: boolean;
  free_delivery_min_order: number;
  default_fee: number;
  estimated_time_min: number;
  estimated_time_max: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_order?: number;
  estimated_time_min?: number;
  estimated_time_max?: number;
  active: boolean;
}

export interface DeliveryDay {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  active: boolean;
}

export interface MounéClass {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  totalWeight: string;
  mealsCount: number;
  price: number;
  cost?: number;
  image: string;
  category: string;
  isActive?: boolean;
  classType: "mini" | "classic" | "premium";
}

export interface MounéClassComponent {
  id: string;
  mouneClassId: string;
  productId?: string;
  productName: string;
  productNameAr: string;
  quantity: number;
  unit: string;
}

export interface DeliveryConfig {
  settings: DeliverySettings;
  zones: DeliveryZone[];
  schedule: DeliveryDay[];
}

// --- Impact System Types ---

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

export interface UserImpact {
  id: string;
  created_at: string;
  user_id: string;
  campaign_id: string;
  order_id: string;
  contribution_amount: number;
  impact_units: number;
  impact_type: string;
}

export type ImpactBadgeLevel = "supporter" | "changemaker" | "hero";

export interface UserImpactStats {
  totalContributed: number;
  totalImpactUnits: number;
  badgeLevel: ImpactBadgeLevel;
  campaignContributions: UserImpact[];
}
