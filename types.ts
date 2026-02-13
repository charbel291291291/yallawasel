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
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  created_at?: string;
  paymentMethod: "cash" | "wallet" | "card";
  deliveryZone: string;
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
